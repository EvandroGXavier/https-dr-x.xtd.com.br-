import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Database, Image, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function StorageCleanup() {
  const [keepBackups, setKeepBackups] = useState(5);
  const [daysOldMedia, setDaysOldMedia] = useState(90);
  const [cleanAuditLogs, setCleanAuditLogs] = useState(false);
  const [deleteAllMedia, setDeleteAllMedia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const loadStats = async () => {
    try {
      const { data: storageStats } = await supabase
        .rpc('get_storage_stats' as any)
        .single();
      
      const { data: backupCount } = await supabase
        .from('backup_history')
        .select('id', { count: 'exact' });

      setStats({
        storage: storageStats,
        backups: backupCount?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCleanup = async (action: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const response = await fetch(
        `https://api.dr-x.xtd.com.br/functions/v1/cleanup-storage`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            keepBackups,
            daysOldMedia,
            cleanAuditLogs,
            deleteAllMedia
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message, {
          description: `
            Backups deletados: ${result.backups_deleted}
            Mídias deletadas: ${result.media_deleted}
            Logs deletados: ${result.audit_logs_deleted}
            Espaço liberado: ${result.space_freed_gb} GB
          `
        });
        loadStats();
      } else {
        throw new Error(result.error || 'Erro na limpeza');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao executar limpeza', {
        description: error.message
      });
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Limpeza de Armazenamento
          </CardTitle>
          <CardDescription>
            Libere espaço removendo backups antigos, mídias e logs desnecessários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Uso atual:</strong> wa-midia: 2.99 GB | backups: 163 MB | Total: ~3.15 GB
            </AlertDescription>
          </Alert>

          {/* Backups */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Backups do Sistema
                </h4>
                <p className="text-sm text-muted-foreground">
                  Atualmente: 71 backups (163 MB)
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keepBackups">Manter os N backups mais recentes</Label>
              <Input
                id="keepBackups"
                type="number"
                min="1"
                max="20"
                value={keepBackups}
                onChange={(e) => setKeepBackups(parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground">
                Os {keepBackups} backups mais recentes serão mantidos
              </p>
            </div>

            <Button 
              onClick={() => setShowConfirm('backups')}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Backups Antigos
            </Button>
          </div>

          {/* Mídias WhatsApp */}
          <div className="space-y-4 p-4 border rounded-lg border-destructive bg-destructive/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Mídias do WhatsApp
                </h4>
                <p className="text-sm text-muted-foreground">
                  Atualmente: 2048 arquivos (2.99 GB)
                </p>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este bucket está usando 2.99 GB e bloqueando seu projeto!
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2 p-3 bg-background rounded border-2 border-destructive">
              <Switch
                id="deleteAll"
                checked={deleteAllMedia}
                onCheckedChange={setDeleteAllMedia}
              />
              <Label htmlFor="deleteAll" className="font-semibold cursor-pointer">
                Deletar TODAS as mídias (2048 arquivos)
              </Label>
            </div>

            {!deleteAllMedia && (
              <div className="space-y-2">
                <Label htmlFor="daysOldMedia">Ou deletar apenas mídias antigas</Label>
                <Input
                  id="daysOldMedia"
                  type="number"
                  min="7"
                  max="365"
                  value={daysOldMedia}
                  onChange={(e) => setDaysOldMedia(parseInt(e.target.value) || 90)}
                />
                <p className="text-xs text-muted-foreground">
                  Mídias com mais de {daysOldMedia} dias serão deletadas
                </p>
              </div>
            )}

            <Button 
              onClick={() => setShowConfirm('media')}
              disabled={loading}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteAllMedia ? 'DELETAR TUDO (2.99 GB)' : 'Limpar Mídias Antigas'}
            </Button>
          </div>

          {/* Logs de Auditoria */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Logs de Auditoria</h4>
                <p className="text-sm text-muted-foreground">
                  Tabela security_audit_log (9.3 MB)
                </p>
              </div>
              <Switch
                checked={cleanAuditLogs}
                onCheckedChange={setCleanAuditLogs}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Remove logs com mais de 90 dias
            </p>
          </div>

          {/* Limpeza Completa */}
          <Button 
            onClick={() => setShowConfirm('all')}
            disabled={loading}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Executar Limpeza Completa
          </Button>

          {loading && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Processando limpeza...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!showConfirm} onOpenChange={() => setShowConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
          <AlertDialogDescription>
            {showConfirm === 'backups' && `Isso deletará todos os backups exceto os ${keepBackups} mais recentes.`}
            {showConfirm === 'media' && (
              deleteAllMedia 
                ? 'Isso deletará TODAS as 2048 mídias do WhatsApp (2.99 GB). Esta é a única forma de desbloquear seu projeto!'
                : `Isso deletará todas as mídias com mais de ${daysOldMedia} dias.`
            )}
            {showConfirm === 'all' && 'Isso executará todas as limpezas configuradas.'}
            <br /><br />
            <strong className="text-destructive">Esta ação não pode ser desfeita!</strong>
          </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showConfirm && handleCleanup(showConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmar Limpeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}