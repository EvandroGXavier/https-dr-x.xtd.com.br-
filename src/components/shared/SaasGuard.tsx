import React from 'react';
import { useSaasGuard } from '@/hooks/useSaasGuard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SaasGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SaasGuard = ({ children, fallback }: SaasGuardProps) => {
  const { isSaasConfigured } = useSaasGuard();

  if (!isSaasConfigured) {
    return fallback || (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Configuração SaaS incompleta. Entre em contato com o administrador para configurar empresa e filial.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};