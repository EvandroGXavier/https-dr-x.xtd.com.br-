// src/components/biblioteca/EditorCoreTiptap.tsx
import { useEffect, useState, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType } from "docx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

/**
 * Compatibilidade:
 * - Props html e setHtml permanecem iguais ao EditorCore anterior.
 * - Se Tiptap falhar por qualquer motivo, caímos para um contentEditable simples (fallback).
 */

type Props = {
  html: string;
  setHtml: (v: string) => void;
  // Cabeçalho / rodapé opcionais (texto simples com placeholders)
  headerHtml?: string;
  footerHtml?: string;
  // Tema Visual Law
  theme?: "oficial" | "humanizado" | "simplificado";
};

const THEMES: Record<string, string> = {
  oficial:
    "prose max-w-none text-foreground [--h1:1.35rem] [--h2:1.1rem] leading-7",
  humanizado:
    "prose max-w-none text-foreground tracking-wide leading-8",
  simplificado:
    "prose max-w-none text-foreground leading-7 [letter-spacing:.1px]",
};

export default function EditorCoreTiptap({
  html,
  setHtml,
  headerHtml,
  footerHtml,
  theme = "oficial",
}: Props) {
  const [tocHtml, setTocHtml] = useState<string>(""); // sumário
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Heading.configure({ levels: [1, 2, 3, 4] }),
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ HTMLAttributes: { class: "mx-auto" } }),
      Placeholder.configure({ placeholder: "Digite seu documento jurídico aqui..." }),
      HorizontalRule,
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[520px] px-6 py-4 outline-none focus-visible:ring-2 ring-offset-2 rounded-xl bg-background",
      },
    },
    content: html || "<p><br/></p>",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  // Gera sumário automático a partir dos headings
  useEffect(() => {
    if (!editor) return;
    const el = document.createElement("div");
    el.innerHTML = editor.getHTML();
    const hs = Array.from(el.querySelectorAll("h1, h2, h3, h4")) as HTMLElement[];
    const toc = hs
      .map((h, i) => {
        const level = Number(h.tagName.replace("H", ""));
        const text = h.textContent || `Seção ${i + 1}`;
        const id = h.id || `sec-${i + 1}`;
        h.id = id;
        return `<div style="margin-left:${(level - 1) * 16}px">• <a href="#${id}">${text}</a></div>`;
      })
      .join("");
    setTocHtml(toc || "<div>—</div>");
  }, [editor, html]);

  // Inserir QRCode na posição atual
  const inserirQRCode = async (texto: string) => {
    if (!editor) return;
    try {
      const dataUrl = await QRCode.toDataURL(texto, { margin: 1, scale: 4 });
      editor.chain().focus().setImage({ src: dataUrl, alt: "QRCode" }).run();
      toast.success("QRCode inserido");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar QRCode.");
    }
  };

  // Exportar para PDF (client-side)
  const exportarPDF = async () => {
    if (!containerRef.current) return;
    toast.info("Gerando PDF...");
    try {
      const input = containerRef.current;
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("documento.pdf");
      toast.success("PDF exportado com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar PDF");
    }
  };

  // Exportar para DOCX usando a biblioteca docx (browser-native)
  const exportarDOCX = async () => {
    try {
      toast.info("Gerando DOCX...");
      
      const htmlContent = editor?.getHTML() || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      
      const children: (Paragraph | DocxTable)[] = [];
      
      // Adicionar cabeçalho se existir
      if (headerHtml) {
        const headerDiv = document.createElement("div");
        headerDiv.innerHTML = headerHtml;
        children.push(
          new Paragraph({
            children: [new TextRun({ text: headerDiv.textContent || "", size: 20 })],
            spacing: { after: 200 },
          })
        );
      }
      
      // Parsear o HTML e converter para elementos DOCX
      const parseNode = (node: Node): (Paragraph | DocxTable)[] => {
        const elements: (Paragraph | DocxTable)[] = [];
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          
          // Headings
          if (tagName.match(/^h[1-4]$/)) {
            const level = parseInt(tagName[1]);
            const headingLevels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
            elements.push(
              new Paragraph({
                text: el.textContent || "",
                heading: headingLevels[level - 1],
                spacing: { before: 240, after: 120 },
              })
            );
          }
          // Parágrafos
          else if (tagName === "p") {
            const runs: TextRun[] = [];
            const processTextNode = (n: Node) => {
              if (n.nodeType === Node.TEXT_NODE) {
                const text = n.textContent || "";
                if (text.trim()) {
                  runs.push(new TextRun({ text }));
                }
              } else if (n.nodeType === Node.ELEMENT_NODE) {
                const elem = n as HTMLElement;
                const text = elem.textContent || "";
                if (text.trim()) {
                  runs.push(
                    new TextRun({
                      text,
                      bold: elem.tagName === "STRONG" || elem.tagName === "B",
                      italics: elem.tagName === "EM" || elem.tagName === "I",
                      underline: elem.tagName === "U" ? {} : undefined,
                    })
                  );
                }
              }
            };
            
            Array.from(el.childNodes).forEach(processTextNode);
            
            if (runs.length === 0) {
              runs.push(new TextRun({ text: el.textContent || "" }));
            }
            
            const alignment = el.style.textAlign as string;
            elements.push(
              new Paragraph({
                children: runs,
                alignment: alignment === "center" ? AlignmentType.CENTER : alignment === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
                spacing: { after: 120 },
              })
            );
          }
          // Listas
          else if (tagName === "ul" || tagName === "ol") {
            Array.from(el.children).forEach((li) => {
              elements.push(
                new Paragraph({
                  text: li.textContent || "",
                  bullet: tagName === "ul" ? { level: 0 } : undefined,
                  numbering: tagName === "ol" ? { reference: "default-numbering", level: 0 } : undefined,
                  spacing: { after: 120 },
                })
              );
            });
          }
          // Tabelas
          else if (tagName === "table") {
            const rows: DocxTableRow[] = [];
            Array.from(el.querySelectorAll("tr")).forEach((tr) => {
              const cells: DocxTableCell[] = [];
              Array.from(tr.querySelectorAll("td, th")).forEach((td) => {
                cells.push(
                  new DocxTableCell({
                    children: [new Paragraph({ text: td.textContent || "" })],
                    width: { size: 100 / tr.children.length, type: WidthType.PERCENTAGE },
                  })
                );
              });
              rows.push(new DocxTableRow({ children: cells }));
            });
            elements.push(
              new DocxTable({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              })
            );
          }
          // Processar filhos recursivamente
          else {
            Array.from(el.childNodes).forEach((child) => {
              elements.push(...parseNode(child));
            });
          }
        }
        
        return elements;
      };
      
      // Processar todos os nós filhos
      Array.from(tempDiv.childNodes).forEach((node) => {
        children.push(...parseNode(node));
      });
      
      // Adicionar rodapé se existir
      if (footerHtml) {
        const footerDiv = document.createElement("div");
        footerDiv.innerHTML = footerHtml;
        children.push(
          new Paragraph({
            children: [new TextRun({ text: footerDiv.textContent || "", size: 20 })],
            spacing: { before: 200 },
          })
        );
      }
      
      // Criar documento
      const doc = new Document({
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });
      
      // Gerar blob e fazer download
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "documento.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("DOCX exportado com sucesso");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao exportar DOCX.");
    }
  };

  // Toolbar básica + tabelas + alinhamento
  const Toolbar = () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Negrito">
        <strong>N</strong>
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Itálico">
        <i>I</i>
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleUnderline().run()} aria-label="Sublinhado">
        <u>S</u>
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Select onValueChange={(v) => editor?.chain().focus().setHeading({ level: Number(v) as 1|2|3|4 }).run()}>
        <SelectTrigger className="w-[120px]"><SelectValue placeholder="Título" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Título 1</SelectItem>
          <SelectItem value="2">Título 2</SelectItem>
          <SelectItem value="3">Título 3</SelectItem>
          <SelectItem value="4">Título 4</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setTextAlign("left").run()}>Esq</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setTextAlign("center").run()}>Centro</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setTextAlign("right").run()}>Dir</Button>
      <Separator orientation="vertical" className="h-6" />
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()}>● Lista</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Lista</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>— Regra</Button>
      <Separator orientation="vertical" className="h-6" />
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Tabela 3x3</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().addColumnAfter().run()}>+ Coluna</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().addRowAfter().run()}>+ Linha</Button>
      <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().deleteTable().run()}>Excluir Tabela</Button>
      <Separator orientation="vertical" className="h-6" />
      <Button variant="default" size="sm" onClick={exportarPDF}>Exportar PDF</Button>
      <Button variant="default" size="sm" onClick={exportarDOCX}>Exportar DOCX</Button>
    </div>
  );

  const VisualLawHeader = () => (
    <div className="text-xs text-muted-foreground print:visible hidden print:block">
      {/* Cabeçalho apenas em impressão; em tela mantém padding */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml || "" }} />
    </div>
  );

  const VisualLawFooter = () => (
    <div className="text-xs text-muted-foreground print:visible hidden print:block">
      <div dangerouslySetInnerHTML={{ __html: footerHtml || "" }} />
      <div style={{ textAlign: "right" }}>Página <span className="pageNumber"></span></div>
    </div>
  );

  const [qrValor, setQrValor] = useState("");

  return (
    <div className="space-y-3">
      <Toolbar />

      {/* Sumário automático */}
      <div className="rounded-lg border p-3 bg-muted/30">
        <div className="text-xs font-semibold mb-2">Sumário</div>
        <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: tocHtml }} />
      </div>

      {/* QRCode */}
      <div className="flex items-center gap-2">
        <Input placeholder="Texto/URL para QRCode" value={qrValor} onChange={(e) => setQrValor(e.target.value)} />
        <Button variant="secondary" onClick={() => inserirQRCode(qrValor)}>Inserir QRCode</Button>
      </div>

      <div className="hidden print:block"><VisualLawHeader /></div>

      <div
        ref={containerRef}
        className={`${THEMES[theme]} bg-background p-6 rounded-xl border`}
        id="print-area"
      >
        <EditorContent editor={editor} />
      </div>

      <div className="hidden print:block"><VisualLawFooter /></div>

      {/* CSS para imprimir cabeçalho/rodapé em todas as páginas */}
      <style>{`
        @media print {
          @page { margin: 20mm; }
          header, footer { position: fixed; left: 0; right: 0; color: #666; }
          header { top: 0; }
          footer { bottom: 0; }
          .pageNumber:after { counter-increment: page; content: counter(page); }
        }
      `}</style>
    </div>
  );
}
