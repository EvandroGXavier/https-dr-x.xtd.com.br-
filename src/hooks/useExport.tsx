import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

interface ExportHeader<T> {
  key: keyof T;
  label: string;
  width?: number;
}

interface UseExportOptions {
  title?: string;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
}

export function useExport<T extends Record<string, any>>(
  data: T[],
  headers: ExportHeader<T>[],
  options: UseExportOptions = {}
) {
  const { toast } = useToast();
  const { title = "Relatório", fileName = "export", orientation = 'portrait' } = options;

  const exportToExcel = useCallback(() => {
    try {
      const exportData = data.map(item => {
        const row: Record<string, any> = {};
        headers.forEach(header => {
          row[header.label] = item[header.key] || '';
        });
        return row;
      });
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-ajustar largura das colunas
      const colWidths = headers.map(header => ({
        wch: Math.max(header.label.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title);
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      
      toast({
        title: "Sucesso",
        description: "Arquivo Excel exportado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo Excel",
        variant: "destructive",
      });
    }
  }, [data, headers, title, fileName, toast]);

  const exportToPDF = useCallback(() => {
    try {
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });
      
      // Configurações de fonte
      doc.setFont('helvetica');
      
      // Título
      doc.setFontSize(16);
      doc.setTextColor(40);
      const pageWidth = doc.internal.pageSize.width;
      const titleWidth = doc.getStringUnitWidth(title) * 16 / doc.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      doc.text(title, titleX, 20);
      
      // Data e hora
      doc.setFontSize(10);
      doc.setTextColor(100);
      const now = new Date();
      const dateStr = `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
      doc.text(dateStr, 20, 30);
      
      // Preparar dados para tabela
      const tableData = data.map(item => 
        headers.map(header => String(item[header.key] || ''))
      );
      
      const tableHeaders = headers.map(header => header.label);
      
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 40,
        styles: { 
          fontSize: orientation === 'landscape' ? 8 : 7,
          cellPadding: 2,
        },
        headStyles: { 
          fillColor: [63, 131, 248],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: headers.reduce((acc, header, index) => {
          if (header.width) {
            acc[index] = { cellWidth: header.width };
          }
          return acc;
        }, {} as Record<number, any>),
        margin: { top: 40 },
        didDrawPage: (data) => {
          // Rodapé
          const pageNumber = data.pageNumber;
          const totalPages = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Página ${pageNumber} de ${totalPages}`,
            pageWidth - 30,
            doc.internal.pageSize.height - 10
          );
        }
      });
      
      doc.save(`${fileName}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "Arquivo PDF exportado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo PDF",
        variant: "destructive",
      });
    }
  }, [data, headers, title, fileName, orientation, toast]);

  const printData = useCallback(() => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de impressão",
          variant: "destructive",
        });
        return;
      }
      
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 20px; 
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #3f83f8;
                padding-bottom: 15px;
              }
              h1 { 
                color: #1e40af; 
                margin: 0 0 10px 0;
                font-size: 24px;
              }
              .date {
                color: #6b7280;
                font-size: 14px;
                margin: 5px 0;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              th, td { 
                border: 1px solid #e5e7eb; 
                padding: 12px 8px; 
                text-align: left;
                font-size: 12px;
              }
              th { 
                background-color: #3f83f8; 
                color: white;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              tr:nth-child(even) { 
                background-color: #f9fafb; 
              }
              tr:hover {
                background-color: #f3f4f6;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #9ca3af;
                border-top: 1px solid #e5e7eb;
                padding-top: 15px;
              }
              @media print {
                body { margin: 0; }
                .header { margin-bottom: 20px; }
                table { font-size: 10px; }
                th, td { padding: 8px 6px; }
                .footer { position: fixed; bottom: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <div class="date">Gerado em: ${dateStr}</div>
              <div class="date">Total de registros: ${data.length}</div>
            </div>
            <table>
              <thead>
                <tr>
                  ${headers.map(header => `<th>${header.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(item => `
                  <tr>
                    ${headers.map(header => {
                      const value = item[header.key];
                      const displayValue = value === null || value === undefined ? '' : String(value);
                      return `<td>${displayValue}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Documento gerado automaticamente pelo sistema</p>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({
        title: "Erro",
        description: "Erro ao preparar impressão",
        variant: "destructive",
      });
    }
  }, [data, headers, title, toast]);

  return {
    exportToExcel,
    exportToPDF,
    printData,
    hasData: data.length > 0
  };
}

export default useExport;