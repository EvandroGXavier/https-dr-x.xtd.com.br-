import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export const useConfiguracoes = (chave: string) => {
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('tenant_id', user.id)
        .eq('chave', chave)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setValor(data.valor || '')
      } else {
        setValor('')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao buscar configuração',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [chave, toast])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const saveConfig = async (novoValor: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' })
        return
      }

      const { error } = await supabase
        .from('configuracoes')
        .upsert(
          // ✅ tenant_id será inserido automaticamente pelo gatilho no BD
          { chave, valor: novoValor, updated_at: new Date().toISOString(), tenant_id: user.id },
          { onConflict: 'tenant_id,chave' }
        )
      
      if (error) throw error

      setValor(novoValor)
      toast({
        title: 'Sucesso!',
        description: 'Configuração salva.',
      })
    } catch (error: any) {
       toast({
        title: 'Erro ao salvar configuração',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return { valor, setValor, saveConfig, loading, refetch: fetchConfig }
}