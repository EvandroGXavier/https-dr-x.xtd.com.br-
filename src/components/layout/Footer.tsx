import { Building2, MapPin, User, AlertTriangle, Shield } from 'lucide-react';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { toast } from 'sonner';

export const Footer = () => {
  const { systemInfo, loading } = useSystemInfo();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (loading) {
    return (
      <footer className="h-8 bg-muted/30 border-t border-border flex items-center justify-center flex-shrink-0">
        <div className="text-xs text-muted-foreground">Carregando...</div>
      </footer>
    );
  }

  // Verificar se os dados obrigatórios estão presentes
  const hasRequiredData = systemInfo.usuario && 
                         systemInfo.empresa.uuid && 
                         systemInfo.filial.uuid &&
                         systemInfo.tenant;

  return (
    <footer className={`h-auto min-h-8 border-t border-border flex items-center justify-between px-4 py-2 flex-shrink-0 ${
      hasRequiredData ? 'bg-muted/30' : 'bg-destructive/20'
    }`}>
      <div className="flex items-center gap-4 text-xs overflow-x-auto flex-wrap">
        {/* Usuário */}
        <div className="flex items-center gap-1 whitespace-nowrap">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className={hasRequiredData ? 'text-muted-foreground' : 'text-destructive'}>
            {systemInfo.usuario?.nome || 'N/A'}
          </span>
          {systemInfo.usuario?.id && (
            <code 
              className="px-1 py-0.5 bg-muted rounded cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => copyToClipboard(systemInfo.usuario!.id, 'ID do usuário')}
              title="Clique para copiar"
            >
              {systemInfo.usuario.id}
            </code>
          )}
        </div>

        {/* Empresa */}
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Building2 className="h-3 w-3 flex-shrink-0" />
          <span className={hasRequiredData ? 'text-muted-foreground' : 'text-destructive'}>
            {systemInfo.empresa.nome || 'N/A'}
          </span>
          {systemInfo.empresa.uuid && (
            <code 
              className="px-1 py-0.5 bg-muted rounded cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => copyToClipboard(systemInfo.empresa.uuid!, 'ID da empresa')}
              title="Clique para copiar"
            >
              {systemInfo.empresa.uuid}
            </code>
          )}
        </div>

        {/* Filial */}
        <div className="flex items-center gap-1 whitespace-nowrap">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className={hasRequiredData ? 'text-muted-foreground' : 'text-destructive'}>
            {systemInfo.filial.nome || 'N/A'}
          </span>
          {systemInfo.filial.uuid && (
            <code 
              className="px-1 py-0.5 bg-muted rounded cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => copyToClipboard(systemInfo.filial.uuid!, 'ID da filial')}
              title="Clique para copiar"
            >
              {systemInfo.filial.uuid}
            </code>
          )}
        </div>

        {/* Tenant */}
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Shield className="h-3 w-3 flex-shrink-0" />
          <span className={hasRequiredData ? 'text-muted-foreground' : 'text-destructive'}>
            Tenant:
          </span>
          {systemInfo.tenant && (
            <code 
              className="px-1 py-0.5 bg-muted rounded cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => copyToClipboard(systemInfo.tenant!, 'Tenant ID')}
              title="Clique para copiar"
            >
              {systemInfo.tenant}
            </code>
          )}
        </div>

        {/* Alerta quando dados estão em branco */}
        {!hasRequiredData && (
          <div className="flex items-center space-x-1 text-destructive whitespace-nowrap">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">Configuração SaaS incompleta</span>
          </div>
        )}
      </div>

      {/* Versão */}
      <div className="hidden md:block text-xs text-muted-foreground/70">
        v1.0.0
      </div>
    </footer>
  );
};