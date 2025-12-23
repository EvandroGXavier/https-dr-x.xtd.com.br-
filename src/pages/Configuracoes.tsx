import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Database, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEtiquetas, useEtiquetaVinculos } from "@/hooks/useEtiquetas";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagChip } from "@/components/etiquetas/TagChip";
import { X, Plus, Tag, Settings, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, isValid } from "date-fns";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { AdminSetup } from "@/components/admin/AdminSetup";
import { BackupRestore } from "@/components/admin/BackupRestore";

import { SecurityConfigPanel } from '@/components/admin/SecurityConfigPanel';
// WhatsAppSettings removido - usando WhatsAppTab agora
import WhatsAppTab from '@/components/configuracoes/WhatsAppTab';
import GeralTab from '@/components/configuracoes/GeralTab';
import { FaseTemplatesTab } from '@/components/configuracoes/FaseTemplatesTab';
import { FEATURES } from '@/config/features';

interface ImportData {
  [key: string]: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  defaultValue: string;
  required: boolean;
}

interface TableOption {
  value: string;
  label: string;
  fields: string[];
}

const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  { sourceField: 'Contatos', targetField: 'nome', defaultValue: 'CONTATO SEM NOME', required: true },
  { sourceField: 'Nome', targetField: 'nome', defaultValue: 'CONTATO SEM NOME', required: false },
  { sourceField: 'Celular', targetField: 'celular', defaultValue: '', required: true },
  { sourceField: 'Fantasia', targetField: 'nome_fantasia', defaultValue: '', required: false },
  { sourceField: 'Endereço', targetField: 'endereco', defaultValue: '', required: false },
  { sourceField: 'Número', targetField: 'numero', defaultValue: '', required: false },
  { sourceField: 'Complemento', targetField: 'complemento', defaultValue: '', required: false },
  { sourceField: 'Bairro', targetField: 'bairro', defaultValue: '', required: false },
  { sourceField: 'CEP', targetField: 'cep', defaultValue: '', required: false },
  { sourceField: 'Cidade', targetField: 'cidade', defaultValue: '', required: false },
  { sourceField: 'UF', targetField: 'uf', defaultValue: '', required: false },
  { sourceField: 'Fone', targetField: 'fone', defaultValue: '', required: false },
  { sourceField: 'Fax', targetField: 'fax', defaultValue: '', required: false },
  { sourceField: 'E-mail', targetField: 'email', defaultValue: '', required: false },
  { sourceField: 'Web Site', targetField: 'web_site', defaultValue: '', required: false },
  { sourceField: 'CNPJ / CPF', targetField: 'cpf_cnpj', defaultValue: '', required: false },
  { sourceField: 'IE / RG', targetField: 'ie_rg', defaultValue: '', required: false },
  { sourceField: 'IE isento', targetField: 'ie_isento', defaultValue: 'false', required: false },
  { sourceField: 'Situação', targetField: 'ativo', defaultValue: 'true', required: false },
  { sourceField: 'Observações', targetField: 'observacoes', defaultValue: '', required: false },
  { sourceField: 'Estado civil', targetField: 'estado_civil', defaultValue: '', required: false },
  { sourceField: 'Profissão', targetField: 'profissao', defaultValue: '', required: false },
  { sourceField: 'Sexo', targetField: 'sexo', defaultValue: '', required: false },
  { sourceField: 'Data nascimento', targetField: 'data_nascimento', defaultValue: '', required: false },
  { sourceField: 'Naturalidade', targetField: 'naturalidade', defaultValue: '', required: false },
  { sourceField: 'Nome pai', targetField: 'nome_pai', defaultValue: '', required: false },
  { sourceField: 'CPF pai', targetField: 'cpf_pai', defaultValue: '', required: false },
  { sourceField: 'Nome mãe', targetField: 'nome_mae', defaultValue: '', required: false },
  { sourceField: 'CPF mãe', targetField: 'cpf_mae', defaultValue: '', required: false },
  { sourceField: 'Segmento', targetField: 'segmento', defaultValue: '', required: false },
  { sourceField: 'Vendedor', targetField: 'vendedor', defaultValue: '', required: false },
  { sourceField: 'E-mail para envio NFe', targetField: 'email_nfe', defaultValue: '', required: false },
  { sourceField: 'Limite de crédito', targetField: 'limite_credito', defaultValue: '0', required: false },
  { sourceField: 'Cliente desde', targetField: 'cliente_desde', defaultValue: '', required: false },
  { sourceField: 'Próxima visita', targetField: 'proxima_visita', defaultValue: '', required: false },
  { sourceField: 'Condição de pagamento', targetField: 'condicao_pagamento', defaultValue: '', required: false },
  { sourceField: 'Regime tributário', targetField: 'regime_tributario', defaultValue: '', required: false },
  { sourceField: 'Código', targetField: 'codigo', defaultValue: '', required: false },
];

const AVAILABLE_TABLES: TableOption[] = [
  {
    value: 'contatos',
    label: 'Contatos',
    fields: [
      'nome', 'nome_fantasia', 'endereco', 'numero', 'complemento', 'bairro', 'cep', 'cidade', 'uf', 'estado',
      'contatos', 'fone', 'fax', 'celular', 'telefone', 'email', 'web_site', 'cpf_cnpj', 'ie_rg', 'ie_isento',
      'ativo', 'observacoes', 'estado_civil', 'profissao', 'sexo', 'data_nascimento', 'naturalidade',
      'nome_pai', 'cpf_pai', 'nome_mae', 'cpf_mae', 'segmento', 'vendedor', 'email_nfe', 'limite_credito',
      'cliente_desde', 'proxima_visita', 'condicao_pagamento', 'regime_tributario', 'codigo'
    ]
  },
  {
    value: 'etiquetas',
    label: 'Etiquetas',
    fields: ['nome', 'descricao', 'cor', 'icone', 'ativa']
  }
];

// Helper function para converter números seriais do Excel para datas
const convertExcelSerialToDate = (serial: number): string | null => {
  try {
    // Excel conta os dias desde 1 de janeiro de 1900
    // Mas tem um bug onde considera 1900 como ano bissexto
    const excelEpoch = new Date(1899, 11, 30); // 30 de dezembro de 1899
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    
    if (isValid(date) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
      return format(date, 'yyyy-MM-dd');
    }
    return null;
  } catch {
    return null;
  }
};

export default function Configuracoes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { etiquetas } = useEtiquetas();
  const [file, setFile] = useState<File | null>(null);
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
  const [openEtiquetaSelector, setOpenEtiquetaSelector] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    errors: number;
    skipped: number;
    duplicates: number;
    errorDetails: string[];
  } | null>(null);
  const [fileFields, setFileFields] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(DEFAULT_FIELD_MAPPINGS);
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('contatos');
  const [availableTargetFields, setAvailableTargetFields] = useState<string[]>(AVAILABLE_TABLES[0].fields);

  const analyzeFile = async (selectedFile: File) => {
    try {
      console.log('Analisando arquivo:', selectedFile.name);
      console.log('Estado do arquivo após setFile:', !!selectedFile);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      console.log('Dados extraídos:', data);
      
      if (data.length > 0) {
        const headers = data[0] as string[];
        console.log('Headers encontrados:', headers);
        setFileFields(headers);
        
        // Atualizar mapeamentos com campos encontrados e sugerir destinos
        const updatedMappings = headers.map(header => {
          const existingMapping = DEFAULT_FIELD_MAPPINGS.find(m => m.sourceField === header);
          if (existingMapping) {
            return existingMapping;
          }
          
          // Sugerir campo de destino baseado no nome da coluna
          const suggestedField = suggestTargetField(header, availableTargetFields);
          
          return {
            sourceField: header,
            targetField: suggestedField,
            defaultValue: '',
            required: false
          };
        });
        console.log('Mapeamentos atualizados:', updatedMappings);
        setFieldMappings(updatedMappings);
        setShowFieldMapping(true);
        
        toast({
          title: "Arquivo analisado",
          description: `${headers.length} campos encontrados no arquivo`,
        });
      } else {
        toast({
          title: "Arquivo vazio",
          description: "Nenhum dado encontrado no arquivo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao analisar arquivo:', error);
      toast({
        title: "Erro ao analisar arquivo",
        description: "Não foi possível ler o arquivo Excel",
        variant: "destructive"
      });
      // Resetar o estado em caso de erro
      setFile(null);
      setShowFieldMapping(false);
    }
  };
  
  const suggestTargetField = (sourceField: string, targetFields: string[]): string => {
    const normalized = sourceField.toLowerCase().trim();
    
    // Mapeamentos diretos mais comuns
    const directMappings: { [key: string]: string } = {
      'nome': 'nome',
      'name': 'nome',
      'contato': 'nome',
      'contatos': 'nome',
      'cliente': 'nome',
      'fantasia': 'nome_fantasia',
      'nome fantasia': 'nome_fantasia',
      'razao social': 'nome',
      'email': 'email',
      'e-mail': 'email',
      'celular': 'celular',
      'telefone': 'fone',
      'fone': 'fone',
      'cpf': 'cpf_cnpj',
      'cnpj': 'cpf_cnpj',
      'cpf/cnpj': 'cpf_cnpj',
      'endereco': 'endereco',
      'endereço': 'endereco',
      'cidade': 'cidade',
      'estado': 'estado',
      'uf': 'uf',
      'cep': 'cep',
      'bairro': 'bairro',
      'numero': 'numero',
      'número': 'numero',
      'complemento': 'complemento',
      'observacoes': 'observacoes',
      'observações': 'observacoes',
      'cor': 'cor',
      'color': 'cor',
      'descricao': 'descricao',
      'descrição': 'descricao',
      'description': 'descricao',
      'icone': 'icone',
      'icon': 'icone',
      'ativa': 'ativa',
      'ativo': 'ativo',
      'active': 'ativo'
    };
    
    // Verificar mapeamento direto
    if (directMappings[normalized] && targetFields.includes(directMappings[normalized])) {
      return directMappings[normalized];
    }
    
    // Buscar por similaridade
    for (const targetField of targetFields) {
      if (normalized.includes(targetField) || targetField.includes(normalized)) {
        return targetField;
      }
    }
    
    return '';
  };
  
  const handleTableChange = (tableValue: string) => {
    setSelectedTable(tableValue);
    const table = AVAILABLE_TABLES.find(t => t.value === tableValue);
    if (table) {
      setAvailableTargetFields(table.fields);
      
      // Reagerar sugestões para os campos já mapeados
      if (fileFields.length > 0) {
        const updatedMappings = fileFields.map(header => {
          const existingMapping = fieldMappings.find(m => m.sourceField === header);
          const suggestedField = suggestTargetField(header, table.fields);
          
          return {
            sourceField: header,
            targetField: existingMapping?.targetField && table.fields.includes(existingMapping.targetField) 
              ? existingMapping.targetField 
              : suggestedField,
            defaultValue: existingMapping?.defaultValue || '',
            required: existingMapping?.required || false,
          };
        });
        setFieldMappings(updatedMappings);
      }
    }
  };
  
  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, {
      sourceField: '',
      targetField: '',
      defaultValue: '',
      required: false
    }]);
  };
  
  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    console.log('Arquivo selecionado:', selectedFile);
    
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          !selectedFile.name.endsWith('.xlsx')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx)",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setImportResults(null);
      setShowFieldMapping(false); // Reset do estado
      setFileFields([]); // Limpar campos anteriores
      setFieldMappings([]); // Limpar mapeamentos anteriores
      analyzeFile(selectedFile);
    }
  };

  const updateFieldMapping = (index: number, field: 'targetField' | 'defaultValue' | 'required', value: string | boolean) => {
    const updatedMappings = [...fieldMappings];
    updatedMappings[index] = { ...updatedMappings[index], [field]: value };
    setFieldMappings(updatedMappings);
  };

  const validateRequiredFields = () => {
    // Verificar se pelo menos um campo está mapeado para nome
    const hasNomeMapping = fieldMappings.some(mapping => 
      mapping.targetField === 'nome' && mapping.sourceField
    );
    
    
    return hasNomeMapping;
  };

  const mapDataToContact = (row: ImportData) => {
    const contactData: any = { user_id: user?.id };
    
    fieldMappings.forEach(mapping => {
      if (mapping.targetField && mapping.targetField !== 'none') {
        let value: any = row[mapping.sourceField] || mapping.defaultValue;
        
        // Processamento especial para alguns campos
        if (mapping.targetField === 'ie_isento') {
          contactData[mapping.targetField] = value === 'Sim' || value === '1' || value === 'true';
        } else if (mapping.targetField === 'ativo') {
          contactData[mapping.targetField] = value === 'Ativo' || value === 'true' || value === '1';
        } else if (mapping.targetField === 'limite_credito') {
          contactData[mapping.targetField] = value ? parseFloat(value.toString().replace(',', '.')) || 0 : 0;
        } else if (mapping.targetField.includes('data_') && value) {
          try {
            // Se o valor for um número (serial do Excel), converter para data
            if (typeof value === 'number' || (!isNaN(Number(value)) && Number(value) > 1)) {
              const convertedDate = convertExcelSerialToDate(Number(value));
              contactData[mapping.targetField] = convertedDate;
            } else if (typeof value === 'string' && value.trim() !== '') {
              // Tentar converter string para data
              const date = new Date(value);
              if (isValid(date)) {
                contactData[mapping.targetField] = format(date, 'yyyy-MM-dd');
              } else {
                contactData[mapping.targetField] = null;
              }
            } else {
              contactData[mapping.targetField] = null;
            }
          } catch {
            contactData[mapping.targetField] = null;
          }
        } else {
          contactData[mapping.targetField] = value || null;
        }
      }
    });
    
    // Garantir que sempre tem um nome
    if (!contactData.nome || contactData.nome === '') {
      contactData.nome = 'CONTATO SEM NOME';
    }
    
    return contactData;
  };

  const addEtiqueta = (etiquetaId: string) => {
    if (!selectedEtiquetas.includes(etiquetaId)) {
      setSelectedEtiquetas([...selectedEtiquetas, etiquetaId]);
    }
    setOpenEtiquetaSelector(false);
  };

  const removeEtiqueta = (etiquetaId: string) => {
    setSelectedEtiquetas(selectedEtiquetas.filter(id => id !== etiquetaId));
  };

  const processImport = async () => {
    if (!file || !user) return;

    if (!validateRequiredFields()) {
      toast({
        title: "Configuração incompleta",
        description: "Configure pelo menos os campos obrigatórios: nome e celular",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setImportResults(null);

    try {
      // Ler o arquivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<ImportData>(worksheet);

      console.log('Dados do Excel:', data);

      const total = data.length;
      let success = 0;
      let errors = 0;
      let skipped = 0;
      let duplicates = 0;
      const errorDetails: string[] = [];
      const insertedContactIds: string[] = [];

      // Buscar CPFs/CNPJs existentes para verificar duplicação
      const { data: existingContacts } = await supabase
        .from('contatos_v2')
        .select('cpf_cnpj')
        .eq('user_id', user.id)
        .not('cpf_cnpj', 'is', null);

      const existingCpfCnpjs = new Set(existingContacts?.map(c => c.cpf_cnpj) || []);

      // Filtrar e validar dados antes de processar
      const validData = [];
      for (const row of data) {
        const mappedContact = mapDataToContact(row);
        
        // Permitir importação mesmo sem dados - apenas verificar se há algum dado relevante
        const hasAnyRelevantData = Object.values(mappedContact).some(val => 
          val && val !== null && val !== '' && val !== 'CONTATO SEM NOME'
        );
        
        if (!hasAnyRelevantData) {
          skipped++;
          errorDetails.push(`Linha ${validData.length + skipped + duplicates + 1}: Linha sem dados relevantes`);
          continue;
        }

        // Verificar duplicação por CPF/CNPJ
        if (mappedContact.cpf_cnpj && existingCpfCnpjs.has(mappedContact.cpf_cnpj)) {
          duplicates++;
          errorDetails.push(`Linha ${validData.length + skipped + duplicates + 1}: CPF/CNPJ ${mappedContact.cpf_cnpj} já existe`);
          continue;
        }

        validData.push(mappedContact);
      }

      console.log(`Dados validados: ${validData.length} de ${total} registros`);

      // Processar dados válidos em lotes
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < validData.length; i += batchSize) {
        batches.push(validData.slice(i, i + batchSize));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        try {
          const { data: insertData, error } = await supabase
            .from('contatos_v2')
            .insert(batch)
            .select('id');

          if (error) {
            console.error('Erro no lote:', error);
            errors += batch.length;
            errorDetails.push(`Lote ${batchIndex + 1}: ${error.message}`);
          } else {
            success += insertData?.length || 0;
            // Coletar IDs dos contatos inseridos para vincular etiquetas
            if (insertData) {
              insertedContactIds.push(...insertData.map(contact => contact.id));
            }
          }
        } catch (err) {
          console.error('Erro ao processar lote:', err);
          errors += batch.length;
          errorDetails.push(`Lote ${batchIndex + 1}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }

        // Atualizar progresso
        const progressValue = ((batchIndex + 1) / Math.max(batches.length, 1)) * 80; // 80% para importação
        setProgress(progressValue);
      }

      // Vincular etiquetas aos contatos importados
      if (selectedEtiquetas.length > 0 && insertedContactIds.length > 0) {
        const etiquetaVinculos = [];
        for (const contactId of insertedContactIds) {
          for (const etiquetaId of selectedEtiquetas) {
            etiquetaVinculos.push({
              etiqueta_id: etiquetaId,
              referencia_tipo: 'contato',
              referencia_id: contactId,
              user_id: user.id
            });
          }
        }

        try {
          const { error: etiquetaError } = await supabase
            .from('etiqueta_vinculos')
            .insert(etiquetaVinculos);

          if (etiquetaError) {
            console.error('Erro ao vincular etiquetas:', etiquetaError);
            errorDetails.push(`Erro ao vincular etiquetas: ${etiquetaError.message}`);
          }
        } catch (err) {
          console.error('Erro ao vincular etiquetas:', err);
          errorDetails.push(`Erro ao vincular etiquetas: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      }

      setProgress(100);

      setImportResults({
        total,
        success,
        errors,
        skipped,
        duplicates,
        errorDetails
      });

      toast({
        title: "Importação concluída",
        description: `${success} registros importados com sucesso. ${errors} erros.`,
        variant: success > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido na importação",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema e importação de dados.
          </p>
        </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="import">Importação</TabsTrigger>
          <TabsTrigger value="automacao-fase">Automação</TabsTrigger>
          <TabsTrigger value="biblioteca">Biblioteca</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="admin-setup">Admin</TabsTrigger>
          <TabsTrigger value="backup-restore">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importação Bling → Epr
              </CardTitle>
              <CardDescription>
                Importe contatos do sistema Bling através de um arquivo Excel (.xlsx).
                Suporta importação de mais de 9.000 registros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="table-select">Tabela de Destino</Label>
                  <Select value={selectedTable} onValueChange={handleTableChange}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecionar tabela..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TABLES.map(table => (
                        <SelectItem key={table.value} value={table.value}>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {table.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="file-upload">Arquivo Excel (.xlsx)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    disabled={isImporting}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Etiquetas para Aplicar nos Registros Importados</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap min-h-[40px] border rounded-md p-2">
                      {selectedEtiquetas.map((etiquetaId) => {
                        const etiqueta = etiquetas.find(e => e.id === etiquetaId);
                        return etiqueta ? (
                          <TagChip
                            key={etiqueta.id}
                            nome={etiqueta.nome}
                            cor={etiqueta.cor}
                            icone={etiqueta.icone || "🏷️"}
                            onRemove={() => removeEtiqueta(etiqueta.id)}
                          />
                        ) : null;
                      })}
                      
                      <Popover open={openEtiquetaSelector} onOpenChange={setOpenEtiquetaSelector}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 px-2" disabled={isImporting}>
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Etiqueta
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar etiquetas..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>Nenhuma etiqueta encontrada</CommandEmpty>
                              <CommandGroup>
                                {etiquetas
                                  .filter(e => !selectedEtiquetas.includes(e.id))
                                  .map((etiqueta) => (
                                    <CommandItem
                                      key={etiqueta.id}
                                      onSelect={() => addEtiqueta(etiqueta.id)}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-sm mr-1">{etiqueta.icone || "🏷️"}</span>
                                      <span>{etiqueta.nome}</span>
                                      {etiqueta.descricao && (
                                        <span className="text-xs text-muted-foreground">
                                          - {etiqueta.descricao}
                                        </span>
                                      )}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selecione etiquetas que serão aplicadas automaticamente a todos os contatos importados.
                      Isso permitirá filtrar e identificar facilmente os registros desta importação.
                    </p>
                  </div>
                </div>

                {file && fileFields.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Mapeamento de Campos
                      </CardTitle>
                      <CardDescription>
                        Configure como os campos do arquivo serão mapeados para o sistema. 
                        Campo obrigatório: pelo menos um campo deve ser mapeado para "nome".
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div className="text-sm text-muted-foreground mb-4">
                          <strong>Campos encontrados no arquivo:</strong> {fileFields.length}
                        </div>
                        {fieldMappings.map((mapping, index) => (
                          <div key={mapping.sourceField} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                            <div>
                              <Label className="text-sm font-medium">Campo do Arquivo (Origem)</Label>
                              <div className="p-2 bg-muted rounded text-sm font-mono">{mapping.sourceField}</div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Campo de Destino (Sistema)</Label>
                              <Select 
                                value={mapping.targetField} 
                                onValueChange={(value) => updateFieldMapping(index, 'targetField', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar campo..." />
                                </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="">Não mapear</SelectItem>
                                   {availableTargetFields.map(field => (
                                     <SelectItem key={field} value={field}>
                                       {field}
                                       {field === 'nome' && <span className="text-red-500 ml-1">*</span>}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Valor Padrão</Label>
                              <Input
                                value={mapping.defaultValue}
                                onChange={(e) => updateFieldMapping(index, 'defaultValue', e.target.value)}
                                placeholder="Valor quando vazio..."
                              />
                            </div>
                            
                            <div className="flex items-center justify-center space-x-2">
                              <div className="text-center">
                                <Label className="text-sm font-medium block mb-2">Obrigatório</Label>
                                <input
                                  type="checkbox"
                                  checked={mapping.required}
                                  onChange={(e) => updateFieldMapping(index, 'required', e.target.checked)}
                                  className="w-4 h-4 rounded"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {!validateRequiredFields() && (
                        <Alert className="border-destructive mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Atenção:</strong> Configure pelo menos um campo para ser mapeado como "nome" para que a importação funcione corretamente.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {file && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      {showFieldMapping && ` - ${fileFields.length} campos detectados`}
                    </AlertDescription>
                  </Alert>
                )}

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Importando dados...</span>
                      <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                {importResults && (
                  <div className="space-y-4">
                    <Alert className={importResults.errors > 0 ? "border-destructive" : "border-green-500"}>
                      {importResults.errors > 0 ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                         <div className="space-y-2">
                           <div className="flex gap-4 flex-wrap">
                             <Badge variant="secondary">Total: {importResults.total}</Badge>
                             <Badge variant="default">Sucesso: {importResults.success}</Badge>
                             {importResults.skipped > 0 && (
                               <Badge variant="outline">Ignorados: {importResults.skipped}</Badge>
                             )}
                             {importResults.duplicates > 0 && (
                               <Badge variant="outline">Duplicados: {importResults.duplicates}</Badge>
                             )}
                             {importResults.errors > 0 && (
                               <Badge variant="destructive">Erros: {importResults.errors}</Badge>
                             )}
                           </div>
                          {importResults.errorDetails.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Detalhes dos erros:</p>
                              <ul className="list-disc list-inside text-sm mt-1">
                                {importResults.errorDetails.slice(0, 5).map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                                {importResults.errorDetails.length > 5 && (
                                  <li>... e mais {importResults.errorDetails.length - 5} erros</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="flex gap-2">
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Debug: file={!!file}, isImporting={isImporting}, validateFields={validateRequiredFields()}
                    </div>
                  )}
                  
                  <Button 
                    onClick={processImport} 
                    disabled={!file || isImporting || !validateRequiredFields()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isImporting ? 'Importando...' : 'Iniciar Importação'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      try {
                        const link = document.createElement('a');
                        link.href = '/template-importacao-bling.xlsx';
                        link.download = 'template-importacao-bling.xlsx';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        toast({
                          title: "Template baixado",
                          description: "O arquivo template foi baixado com sucesso.",
                        });
                      } catch (error) {
                        console.error('Erro ao baixar template:', error);
                        toast({
                          title: "Erro ao baixar template",
                          description: "Verifique se o arquivo template existe no servidor.",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Template
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Campos Mapeados</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>ID → Código</div>
                  <div>Nome → Nome</div>
                  <div>Fantasia → Nome Fantasia</div>
                  <div>Endereço → Endereço</div>
                  <div>Celular → Celular</div>
                  <div>E-mail → Email</div>
                  <div>CNPJ/CPF → CPF/CNPJ</div>
                  <div>Situação → Ativo</div>
                  <div>E mais 30+ campos...</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biblioteca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Biblioteca</CardTitle>
              <CardDescription>
                Configure chaves e configurações padrão para o módulo Biblioteca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="biblioteca-api-key">Chave de API</Label>
                  <Input
                    id="biblioteca-api-key"
                    type="password"
                    placeholder="Insira a chave de API da Biblioteca"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="biblioteca-empresa-padrao">Empresa Padrão</Label>
                  <Input
                    id="biblioteca-empresa-padrao"
                    placeholder="Nome da empresa padrão para documentos"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="biblioteca-advogado-responsavel">Advogado Responsável Padrão</Label>
                  <Input
                    id="biblioteca-advogado-responsavel"
                    placeholder="Nome do advogado responsável padrão"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="biblioteca-formato-data">Formato de Data Padrão</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato de data" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="biblioteca-limite-modelos">Limite de Modelos por Usuário</Label>
                  <Input
                    id="biblioteca-limite-modelos"
                    type="number"
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
                
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="general" className="space-y-6">
          <GeralTab />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="space-y-6">
            <SecurityDashboard />
            <SecurityConfigPanel />
          </div>
        </TabsContent>

        <TabsContent value="admin-setup" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Configuração de Administradores</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie usuários administradores do sistema
              </p>
            </div>
            <AdminSetup />
          </div>
        </TabsContent>

        <TabsContent value="backup-restore" className="space-y-6">
          <BackupRestore />
        </TabsContent>

        <TabsContent value="automacao-fase" className="space-y-6">
          <FaseTemplatesTab />
        </TabsContent>

        {FEATURES.WHATSAPP_V2 && (
          <TabsContent value="whatsapp" className="space-y-6">
            <WhatsAppTab />
          </TabsContent>
        )}
      </Tabs>
      </div>
    </AppLayout>
  );
}