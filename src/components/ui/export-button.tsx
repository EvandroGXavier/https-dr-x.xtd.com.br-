import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useExport } from "@/hooks/useExport";

interface ExportButtonProps<T> {
  data: T[];
  fileName: string;
  headers: { key: keyof T; label: string; width?: number }[];
  title?: string;
  orientation?: 'portrait' | 'landscape';
  disabled?: boolean;
}

export function ExportButton<T extends Record<string, any>>({
  data,
  fileName,
  headers,
  title = "Relatório",
  orientation = 'portrait',
  disabled = false
}: ExportButtonProps<T>) {
  
  const { exportToExcel, exportToPDF, printData, hasData } = useExport(
    data,
    headers,
    { title, fileName, orientation }
  );

  const isDisabled = disabled || !hasData;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDisabled}>
          <Download className="h-4 w-4 mr-2" />
          Exportar {hasData && `(${data.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel} disabled={isDisabled}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isDisabled}>
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={printData} disabled={isDisabled}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}