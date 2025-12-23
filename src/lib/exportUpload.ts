// src/lib/exportUpload.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { supabase } from "@/integrations/supabase/client";

/** Gera PDF a partir de um elemento (mantendo estilos visíveis) e retorna Blob */
export async function makePDFFromElement(el: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
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
  return pdf.output("blob");
}

/** Gera DOCX a partir de HTML completo (com header/footer opcionais) */
export async function makeDOCXFromHTML(html: string): Promise<Blob> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const children: Paragraph[] = [];

  const processNode = (node: Node): Paragraph[] => {
    const paragraphs: Paragraph[] = [];
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      if (tagName === "h1") {
        paragraphs.push(new Paragraph({ text: el.textContent || "", heading: HeadingLevel.HEADING_1 }));
      } else if (tagName === "h2") {
        paragraphs.push(new Paragraph({ text: el.textContent || "", heading: HeadingLevel.HEADING_2 }));
      } else if (tagName === "h3") {
        paragraphs.push(new Paragraph({ text: el.textContent || "", heading: HeadingLevel.HEADING_3 }));
      } else if (tagName === "h4") {
        paragraphs.push(new Paragraph({ text: el.textContent || "", heading: HeadingLevel.HEADING_4 }));
      } else if (tagName === "p") {
        const runs: TextRun[] = [];
        const processText = (n: Node) => {
          if (n.nodeType === Node.TEXT_NODE) {
            runs.push(new TextRun({ text: n.textContent || "" }));
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            const e = n as HTMLElement;
            const isBold = e.tagName === "STRONG" || e.tagName === "B";
            const isItalic = e.tagName === "EM" || e.tagName === "I";
            const isUnderline = e.tagName === "U";
            runs.push(new TextRun({ 
              text: e.textContent || "", 
              bold: isBold, 
              italics: isItalic, 
              underline: isUnderline ? {} : undefined 
            }));
          }
        };
        Array.from(el.childNodes).forEach(processText);
        paragraphs.push(new Paragraph({ children: runs.length > 0 ? runs : [new TextRun({ text: el.textContent || "" })] }));
      } else if (tagName === "ul" || tagName === "ol") {
        Array.from(el.children).forEach((li) => {
          if (li.tagName.toLowerCase() === "li") {
            paragraphs.push(new Paragraph({ text: li.textContent || "", bullet: { level: 0 } }));
          }
        });
      } else {
        Array.from(el.childNodes).forEach(child => {
          paragraphs.push(...processNode(child));
        });
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      paragraphs.push(new Paragraph({ text: node.textContent }));
    }
    
    return paragraphs;
  };

  Array.from(doc.body.childNodes).forEach(node => {
    children.push(...processNode(node));
  });

  const document = new Document({
    sections: [{ children: children.length > 0 ? children : [new Paragraph({ text: "" })] }]
  });

  return await Packer.toBlob(document);
}

/** Sobe arquivo ao Storage (bucket 'exportados') e retorna URL pública (se configurada) */
export async function uploadToStorage(file: Blob, filename: string): Promise<string | null> {
  const bucket = "exportados";
  
  // Tentar criar o bucket (ignora erro se já existir)
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});
  
  const path = `${Date.now()}-${filename}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { 
    upsert: true, 
    contentType: file.type 
  });
  
  if (error) throw error;
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl ?? null;
}
