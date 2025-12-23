// src/components/biblioteca/EditorCorePro.tsx
import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
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
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Upload, Code, AlignJustify, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline as UIcon, ListOrdered, List, Quote, Link as LinkIcon, Image as ImageIcon, Minus, Table as TableIcon, QrCode, FileDown, FileCode2, Search } from "lucide-react";
import { makeDOCXFromHTML, makePDFFromElement, uploadToStorage } from "@/lib/exportUpload";
import { TextBox } from "./extensions/TextBox";
import { toast } from "sonner";
import SearchReplaceDialog from "./SearchReplaceDialog";

type Props = {
  html: string;
  setHtml: (v: string) => void;
  headerHtml?: string;
  footerHtml?: string;
  theme?: "oficial" | "humanizado" | "simplificado";
  readOnly?: boolean;
  onTocChange?: (toc: string) => void;
};

export type EditorCoreProRef = {
  getHtml: () => string;
  setHtml: (v: string) => void;
  focus: () => void;
};

const THEMES: Record<string, string> = {
  oficial: "prose max-w-none text-zinc-900 leading-7",
  humanizado: "prose max-w-none text-zinc-800 tracking-wide leading-8",
  simplificado: "prose max-w-none text-zinc-900 leading-7 [letter-spacing:.1px]",
};

const EditorCorePro = forwardRef<EditorCoreProRef, Props>(function EditorCorePro({
  html,
  setHtml,
  headerHtml,
  footerHtml,
  theme = "oficial",
  readOnly = false,
  onTocChange,
}, ref) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(html || "<p></p>");
  const [tocHtml, setTocHtml] = useState("<div>—</div>");
  const [qrText, setQrText] = useState("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [initialSearchText, setInitialSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit,
      Underline,
      Heading.configure({ levels: [1, 2, 3, 4] }),
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ HTMLAttributes: { class: "mx-auto" } }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
      Placeholder.configure({ placeholder: "Digite seu documento jurídico..." }),
      HorizontalRule,
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight,
      Color,
      TextStyle,
      TextBox,
    ],
    content: html || "<p><br/></p>",
    onUpdate: ({ editor }) => {
      const out = editor.getHTML();
      setHtml(out);
      if (sourceMode) setSourceValue(out);
    },
  });

  // Hidratar quando prop muda
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (html != null && html !== current) {
      editor.commands.setContent(html);
      if (sourceMode) setSourceValue(html);
    }
  }, [html, editor, sourceMode]);

  useImperativeHandle(ref, () => ({
    getHtml: () => editor?.getHTML() ?? "",
    setHtml: (v: string) => {
      editor?.commands.setContent(v || "<p></p>");
      setSourceValue(v || "<p></p>");
    },
    focus: () => editor?.commands.focus(),
  }), [editor]);

  // Sumário automático (H1..H4)
  useEffect(() => {
    if (!editor) return;
    const el = document.createElement("div");
    el.innerHTML = editor.getHTML();
    const hs = Array.from(el.querySelectorAll("h1,h2,h3,h4")) as HTMLElement[];
    const toc = hs.map((h, i) => {
      const level = Number(h.tagName.replace("H", ""));
      const text = h.textContent || `Seção ${i + 1}`;
      const id = h.id || `sec-${i + 1}`;
      h.id = id;
      return `<div style="margin-left:${(level - 1) * 16}px">• <a href="#${id}">${text}</a></div>`;
    }).join("");
    setTocHtml(toc || "<div>—</div>");
  }, [editor, html]);

  // Inserir QRCode
  const insertQRCode = async (payload: string) => {
    if (!editor || !payload.trim()) {
      toast.error("Informe o texto/URL para o QR Code");
      return;
    }
    try {
      const dataUrl = await QRCode.toDataURL(payload, { scale: 4, margin: 1 });
      editor.chain().focus().setImage({ src: dataUrl, alt: "QRCode" }).run();
      toast.success("QR Code inserido");
      setQrText("");
    } catch (error) {
      toast.error("Erro ao gerar QR Code");
      console.error(error);
    }
  };

  const replaceQRPlaceholders = async (markup: string) => {
    const re = /\{\{qrcode:([^}]+)\}\}/gi;
    let out = markup;
    for (const m of markup.matchAll(re)) {
      const img = await QRCode.toDataURL(m[1].trim(), { scale: 4, margin: 1 });
      out = out.replace(m[0], `<img alt="qrcode" src="${img}" />`);
    }
    return out;
  };

  // Export DOCX (gera + sobe para Storage)
  const exportDOCX = async () => {
    try {
      toast.loading("Gerando DOCX...");
      const htmlFull = `<html><head><meta charset="utf-8"/></head><body><header>${headerHtml||""}</header><main>${await replaceQRPlaceholders(editor?.getHTML()||"")}</main><footer>${footerHtml||""}</footer></body></html>`;
      const blob = await makeDOCXFromHTML(htmlFull);
      const url = await uploadToStorage(blob, "documento.docx");
      downloadBlob(blob, "documento.docx");
      toast.success("DOCX gerado e enviado ao Storage");
      console.log("DOCX:", url||"");
    } catch (error) {
      toast.error("Erro ao gerar DOCX");
      console.error(error);
    }
  };

  // Export PDF (captura container com estilos) + upload
  const exportPDF = async () => {
    try {
      if (!containerRef.current) return;
      toast.loading("Gerando PDF...");
      const printable = containerRef.current.cloneNode(true) as HTMLElement;
      const header = document.createElement("div");
      header.innerHTML = headerHtml || "";
      const footer = document.createElement("div");
      footer.innerHTML = footerHtml || "";
      printable.prepend(header);
      printable.append(footer);
      const blob = await makePDFFromElement(printable);
      const url = await uploadToStorage(blob, "documento.pdf");
      downloadBlob(blob, "documento.pdf");
      toast.success("PDF gerado e enviado ao Storage");
      console.log("PDF:", url||"");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
      console.error(error);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Import/Export HTML bruto e modo código
  const toggleSource = () => {
    if (!editor) return;
    if (!sourceMode) {
      setSourceValue(editor.getHTML());
      editor.setEditable(false);
      setSourceMode(true);
    } else {
      editor.commands.setContent(sourceValue || "<p></p>");
      editor.setEditable(!readOnly);
      setSourceMode(false);
    }
  };

  const importHTMLFile = async (file: File) => {
    try {
      const text = await file.text();
      setSourceValue(text);
      if (!sourceMode) editor?.commands.setContent(text || "<p></p>");
      toast.success("HTML importado");
    } catch (error) {
      toast.error("Erro ao importar arquivo");
      console.error(error);
    }
  };


  // Inserções Visual Law
  const insertVLBox = () => editor?.chain().focus().insertContent(`<div class="vl-box"><strong>Caixa Visual Law:</strong> texto explicativo.</div>`).run();
  const insertVLSelo = () => editor?.chain().focus().insertContent(`<span class="vl-selo">SELO</span> `).run();
  const insertVLIcon = () => editor?.chain().focus().insertContent(`<span class="vl-icon"></span>`).run();
  const insertVLTimeline = () => editor?.chain().focus().insertContent(`<div class="vl-timeline"><div class="item"><strong>Marco 1</strong> — descrição</div><div class="item"><strong>Marco 2</strong> — descrição</div></div>`).run();

  // Função para abrir busca com texto selecionado
  const openSearchDialog = () => {
    const { from, to } = editor?.state.selection || { from: 0, to: 0 };
    const selectedText = editor?.state.doc.textBetween(from, to, " ") || "";
    setInitialSearchText(selectedText);
    setSearchDialogOpen(true);
  };

  // Atalho Ctrl+F para abrir busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openSearchDialog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ToolbarButton: React.FC<React.ComponentProps<typeof Button>> = (p) => <Button variant="ghost" size="sm" className="rounded-2xl" {...p} />;

  return (
    <Card className={`w-full shadow-sm flex flex-col max-h-[calc(100vh-200px)]`}>
      <CardContent className="p-2 flex flex-col h-full">
        {/* Toolbar Fixo */}
        <div className="sticky top-0 z-10 bg-background pb-2 border-b">
          <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} title="Negrito (Ctrl+B)">
            <Bold size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} title="Itálico (Ctrl+I)">
            <Italic size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Sublinhar (Ctrl+U)">
            <UIcon size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("left").run()} title="Alinhar à esquerda">
            <AlignLeft size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("center").run()} title="Centralizar">
            <AlignCenter size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("right").run()} title="Alinhar à direita">
            <AlignRight size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("justify").run()} title="Justificar texto">
            <AlignJustify size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista">
            <List size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Lista numerada">
            <ListOrdered size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
            <Minus size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Citação">
            <Quote size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Inserir tabela">
            <TableIcon size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => {
            const url = prompt("URL do link:"); 
            if (url) editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }} title="Inserir link">
            <LinkIcon size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => {
            const url = prompt("URL da imagem:"); 
            if (url) editor?.chain().focus().setImage({ src: url }).run();
          }} title="Inserir imagem">
            <ImageIcon size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          
          {/* Visual Law */}
          <Badge variant="secondary" className="mx-1">Visual Law</Badge>
          <ToolbarButton onClick={insertVLBox} title="Inserir caixa Visual Law">Caixa</ToolbarButton>
          <ToolbarButton onClick={insertVLSelo} title="Inserir selo">Selo</ToolbarButton>
          <ToolbarButton onClick={insertVLIcon} title="Inserir ícone">Ícone</ToolbarButton>
          <ToolbarButton onClick={insertVLTimeline} title="Inserir linha do tempo">Timeline</ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          
          {/* QR Code */}
          <Input 
            placeholder="Texto/URL p/ QR" 
            className="h-8 w-48" 
            value={qrText} 
            onChange={(e) => setQrText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertQRCode(qrText);
              }
            }}
          />
          <ToolbarButton onClick={() => insertQRCode(qrText)} title="Inserir QR Code">
            <QrCode size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          
          {/* Buscar e Substituir */}
          <ToolbarButton onClick={openSearchDialog} title="Buscar e Substituir (Ctrl+F)">
            <Search size={16}/> Buscar
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          
          {/* Código-fonte & HTML */}
          <ToolbarButton onClick={toggleSource} title="Alternar código-fonte (HTML)">
            <Code size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={() => { const a=document.createElement("a"); const data=editor?.getHTML() ?? sourceValue; const blob=new Blob([data],{type:"text/html;charset=utf-8"}); a.href=URL.createObjectURL(blob); a.download="documento.html"; a.click(); URL.revokeObjectURL(a.href); }} title="Exportar HTML">
            <FileCode2 size={16}/>
          </ToolbarButton>
          <label className="inline-flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-accent rounded-2xl" title="Importar HTML">
            <Upload size={16}/> <span>Importar</span>
            <input type="file" accept=".html,text/html" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; 
              if (f) importHTMLFile(f);
            }} />
          </label>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          
          {/* Exportações */}
          <ToolbarButton onClick={exportPDF} title="Exportar PDF (e enviar ao Storage)">
            <FileDown size={16}/> PDF
          </ToolbarButton>
          <ToolbarButton onClick={exportDOCX} title="Exportar DOCX (e enviar ao Storage)">
            <FileDown size={16}/> DOCX
          </ToolbarButton>
          </div>
        </div>

        {/* Área do editor com ScrollArea */}
        <ScrollArea className="flex-1 mt-2">
          <div ref={containerRef} className={`${THEMES[theme]} bg-background p-6 rounded-xl border relative min-h-[360px]`}>
            {sourceMode ? (
              <textarea className="w-full h-[360px] outline-none bg-background font-mono text-sm" value={sourceValue}
                onChange={(e)=>setSourceValue(e.target.value)}
                onBlur={()=>editor?.commands.setContent(sourceValue||"<p></p>")}
              />
            ) : (<EditorContent editor={editor} />)}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Diálogo de Busca e Substituição */}
      <SearchReplaceDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
        editor={editor}
        initialSearchText={initialSearchText}
      />
    </Card>
  );
});

export default EditorCorePro;
