import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Clock, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AidJob } from '@/hooks/useAid';

interface AidBadgeProps {
  job: AidJob;
  onView?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  className?: string;
}

export function AidBadge({ job, onView, onDelete, compact = false, className }: AidBadgeProps) {
  const getStatusConfig = (status: AidJob['status']) => {
    switch (status) {
      case 'queued':
        return {
          icon: Clock,
          label: 'Na fila',
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
      case 'processing':
        return {
          icon: Loader2,
          label: 'Processando',
          variant: 'default' as const,
          color: 'text-primary',
          animate: true
        };
      case 'succeeded':
        return {
          icon: CheckCircle,
          label: 'Sucesso',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Erro',
          variant: 'destructive' as const,
          color: 'text-destructive'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelado',
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
      default:
        return {
          icon: Bot,
          label: 'AID',
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
    }
  };

  const statusConfig = getStatusConfig(job.status);
  const Icon = statusConfig.icon;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const getExtractedSummary = () => {
    const meta = job.meta || {};
    const items = [];
    
    // Simular dados extraídos baseado no tipo de arquivo
    if (job.mime_type?.startsWith('image/')) {
      items.push('OCR');
    }
    
    // Adicionar tipos de dados que poderiam ter sido extraídos
    if (meta.extracted_entities) {
      const entities = meta.extracted_entities;
      if (entities.nome) items.push('Nome');
      if (entities.cpf || entities.cnpj) items.push('CPF/CNPJ');
      if (entities.email) items.push('E-mail');
      if (entities.telefone) items.push('Telefone');
      if (entities.endereco) items.push('Endereço');
    } else {
      // Fallback para demonstração
      if (job.status === 'succeeded') {
        items.push('Nome', 'CPF', 'Telefone');
      }
    }
    
    return items;
  };

  if (compact) {
    return (
      <Badge 
        variant={statusConfig.variant} 
        className={cn("flex items-center gap-1 text-xs", className)}
      >
        <Icon className={cn(
          "h-3 w-3", 
          statusConfig.color,
          statusConfig.animate && "animate-spin"
        )} />
        <span>AID</span>
      </Badge>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-lg border bg-card", className)}>
      <div className="flex items-center gap-2">
        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
          <Icon className={cn(
            "h-3 w-3", 
            statusConfig.color,
            statusConfig.animate && "animate-spin"
          )} />
          AID
        </Badge>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm">
            <span className={statusConfig.color}>{statusConfig.label}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground text-xs">
              {formatTimestamp(job.created_at)}
            </span>
          </div>
          
          {job.status === 'succeeded' && (
            <div className="flex flex-wrap gap-1 mt-1">
              {getExtractedSummary().map((item, index) => (
                <Badge key={index} variant="outline" className="text-xs h-5">
                  {item}
                </Badge>
              ))}
            </div>
          )}
          
          {job.error && (
            <p className="text-xs text-destructive mt-1 max-w-48 truncate" title={job.error}>
              {job.error}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {job.status === 'succeeded' && onView && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={onView}
            title="Ver resultado"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
        
        {onDelete && ['succeeded', 'failed', 'cancelled'].includes(job.status) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="Excluir job"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}