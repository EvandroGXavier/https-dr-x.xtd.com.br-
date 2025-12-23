import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StorageCleanup } from "./StorageCleanup";
import { 
  Database, 
  Code, 
  Package, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Shield,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BackupHistory {
  id: string;
  backup_type: string;
  backup_size: number;
  file_path: string;
  created_at: string;
  metadata: any;
}

export function BackupRestore() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState("");

  // Load backup history
  const loadBackupHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBackupHistory(data || []);
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  };

  // Database backup
  const handleDatabaseBackup = async () => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentOperation("Iniciando backup do banco de dados...");

    try {
      setProgress(25);
      setCurrentOperation("Exportando dados das tabelas...");

      const { data, error } = await supabase.functions.invoke('backup-database', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Backup failed');
      }

      setProgress(75);
      setCurrentOperation("Preparando download...");

      // Download the backup file
      const blob = new Blob([data.downloadData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setCurrentOperation("Backup concluído!");

      toast({
        title: "Backup criado com sucesso",
        description: `Arquivo: ${data.fileName} (${Math.round(data.size / 1024)} KB)`,
      });

      loadBackupHistory();

    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Erro no backup",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentOperation("");
    }
  };

  // Source code backup (client-side only)
  const handleSourceBackup = async () => {
    setIsProcessing(true);
    setCurrentOperation("Preparando backup do código fonte...");

    try {
      // Create a simple source info file since we can't access full source from browser
      const sourceInfo = {
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          backup_type: 'source_info',
          note: 'Este é um backup de informações do projeto. Para backup completo do código, use ferramentas de controle de versão como Git.'
        },
        project_info: {
          name: 'Lovable Project',
          framework: 'React + TypeScript + Vite',
          ui_library: 'shadcn/ui + Tailwind CSS',
          backend: 'Supabase',
          current_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        dependencies: {
          note: 'Para lista completa de dependências, consulte package.json no projeto'
        }
      };

      const content = JSON.stringify(sourceInfo, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_source_info_${timestamp}.json`;

      // Download the info file
      const blob = new Blob([content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup de informações criado",
        description: "Para backup completo do código, use Git ou ferramentas de versionamento.",
      });

    } catch (error) {
      console.error('Source backup error:', error);
      toast({
        title: "Erro no backup",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentOperation("");
    }
  };

  // Complete backup (database + source info)
  const handleCompleteBackup = async () => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentOperation("Iniciando backup completo...");

    try {
      // First get database backup
      setProgress(10);
      setCurrentOperation("Exportando banco de dados...");

      const { data: dbData, error: dbError } = await supabase.functions.invoke('backup-database', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (dbError) throw dbError;
      if (!dbData.success) throw new Error(dbData.error || 'Database backup failed');

      setProgress(50);
      setCurrentOperation("Preparando informações do código fonte...");

      // Create complete backup with both database and source info
      const completeBackup = {
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          backup_type: 'complete',
          components: ['database', 'source_info']
        },
        database: JSON.parse(dbData.downloadData),
        source_info: {
          project_info: {
            name: 'Lovable Project',
            framework: 'React + TypeScript + Vite',
            ui_library: 'shadcn/ui + Tailwind CSS',
            backend: 'Supabase',
            current_url: window.location.href,
            timestamp: new Date().toISOString()
          }
        }
      };

      setProgress(80);
      setCurrentOperation("Preparando download...");

      const content = JSON.stringify(completeBackup, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_complete_${timestamp}.json`;

      // Download the complete backup
      const blob = new Blob([content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setCurrentOperation("Backup completo concluído!");

      toast({
        title: "Backup completo criado",
        description: `Arquivo: ${fileName} (${Math.round(content.length / 1024)} KB)`,
      });

      loadBackupHistory();

    } catch (error) {
      console.error('Complete backup error:', error);
      toast({
        title: "Erro no backup completo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentOperation("");
    }
  };

  // Handle restore
  const handleRestore = async () => {
    if (!restoreFile || restoreConfirm !== "CONFIRMAR") {
      toast({
        title: "Confirmação necessária",
        description: "Digite 'CONFIRMAR' para prosseguir com o restore.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentOperation("Lendo arquivo de backup...");

    try {
      const fileContent = await restoreFile.text();
      const backupData = JSON.parse(fileContent);

      if (!backupData.metadata || !backupData.data) {
        throw new Error('Formato de arquivo inválido');
      }

      setProgress(25);
      setCurrentOperation("Validando dados do backup...");

      // For complete backups, extract database portion
      const databaseData = backupData.database || backupData;

      setProgress(50);
      setCurrentOperation("Iniciando restore do banco de dados...");

      const { data, error } = await supabase.functions.invoke('restore-database', {
        body: {
          backupData: databaseData,
          confirm: true
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Restore failed');

      setProgress(100);
      setCurrentOperation("Restore concluído!");

      toast({
        title: "Restore concluído com sucesso",
        description: "Os dados foram restaurados. A página será recarregada.",
      });

      // Reload page after successful restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Erro no restore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentOperation("");
      setShowRestoreDialog(false);
      setRestoreFile(null);
      setRestoreConfirm("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'source': return <Code className="h-4 w-4" />;
      case 'complete': return <Package className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getBackupTypeLabel = (type: string) => {
    switch (type) {
      case 'database': return 'Banco de Dados';
      case 'source': return 'Código Fonte';
      case 'complete': return 'Completo';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <StorageCleanup />
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Backup & Restore</h2>
        <Badge variant="secondary">Admin Only</Badge>
      </div>

      {isProcessing && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>{currentOperation}</p>
              <Progress value={progress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Database Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Nível 1: Database Completo
            </CardTitle>
            <CardDescription>
              Backup completo: estrutura + dados do banco
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              • <strong>Estrutura completa:</strong> tabelas, colunas, tipos<br/>
              • <strong>Constraints:</strong> chaves, índices, relacionamentos<br/>
              • <strong>Todos os dados:</strong> todas as tabelas do sistema<br/>
              • <strong>Metadados:</strong> informações do banco e projeto<br/>
              • <strong>Formato:</strong> JSON estruturado para análise por IA<br/>
              • Tamanho estimado: ~2-10 MB
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleDatabaseBackup}
                disabled={isProcessing}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Fazer Backup
              </Button>
              <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isProcessing}>
                    <Upload className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Restore do Banco de Dados
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta operação irá <strong>substituir todos os dados atuais</strong> pelos dados do backup. 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="restore-file">Arquivo de Backup</Label>
                      <Input
                        id="restore-file"
                        type="file"
                        accept=".json"
                        onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-text">Digite "CONFIRMAR" para prosseguir</Label>
                      <Input
                        id="confirm-text"
                        value={restoreConfirm}
                        onChange={(e) => setRestoreConfirm(e.target.value)}
                        placeholder="CONFIRMAR"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRestore}
                      disabled={!restoreFile || restoreConfirm !== "CONFIRMAR"}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Restore Database
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Source Code Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Nível 2: Source Code
            </CardTitle>
            <CardDescription>
              Informações do código fonte do projeto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              • Informações do projeto<br/>
              • Configurações do framework<br/>
              • Metadados do sistema<br/>
              • Tamanho estimado: ~5-50 KB
            </div>
            <Button 
              onClick={handleSourceBackup}
              disabled={isProcessing}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Fazer Backup
            </Button>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Para backup completo do código fonte, use Git ou ferramentas de versionamento.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Complete Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Nível 3: Completo
            </CardTitle>
            <CardDescription>
              Database + informações do código fonte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              • Banco de dados completo<br/>
              • Informações do projeto<br/>
              • Configurações do sistema<br/>
              • Tamanho estimado: ~1-10 MB
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCompleteBackup}
                disabled={isProcessing}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Fazer Backup
              </Button>
              <Button 
                variant="outline" 
                disabled={isProcessing}
                onClick={() => setShowRestoreDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Restore
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Backups
          </CardTitle>
          <CardDescription>
            Últimos backups realizados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={loadBackupHistory}
            variant="outline" 
            size="sm" 
            className="mb-4"
          >
            Atualizar Histórico
          </Button>
          
          {backupHistory.length === 0 ? (
            <p className="text-muted-foreground">Nenhum backup encontrado.</p>
          ) : (
            <div className="space-y-2">
              {backupHistory.map((backup) => (
                <div 
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getBackupTypeIcon(backup.backup_type)}
                    <div>
                      <p className="font-medium">{getBackupTypeLabel(backup.backup_type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {formatFileSize(backup.backup_size)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}