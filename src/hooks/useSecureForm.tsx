import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateFormData, formRateLimiter } from '@/lib/security';

interface UseSecureFormOptions {
  rateLimitKey?: string;
  onSubmit: (data: any) => Promise<void>;
  validate?: (data: any) => { isValid: boolean; errors: string[] };
}

export function useSecureForm({ rateLimitKey, onSubmit, validate }: UseSecureFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSecureSubmit = useCallback(async (data: any) => {
    // Rate limiting check
    const limitKey = rateLimitKey || 'default';
    if (!formRateLimiter.isAllowed(limitKey)) {
      const remainingTime = Math.ceil(formRateLimiter.getRemainingTime(limitKey) / 1000);
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${remainingTime} segundos antes de tentar novamente.`,
        variant: "destructive",
      });
      return;
    }

    // Validation
    const validation = validate ? validate(data) : validateFormData(data);
    if (!validation.isValid) {
      toast({
        title: "Dados inválidos",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "Sucesso",
        description: "Operação realizada com sucesso!",
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validate, rateLimitKey, toast]);

  return {
    handleSecureSubmit,
    isSubmitting
  };
}