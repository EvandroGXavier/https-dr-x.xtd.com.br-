import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Schema Zod para o formulário de configuração inicial
const configSchema = z.object({
  nomeCompleto: z.string().min(3, { message: 'Seu nome completo é obrigatório (mínimo 3 caracteres).' }),
  novaSenha: z.string().min(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' }),
  confirmarSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não coincidem.',
  path: ['confirmarSenha'],
})

export default function ConfiguracaoInicial() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      nomeCompleto: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  })

  async function onSubmit(values: z.infer<typeof configSchema>) {
    if (!user) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Sessão inválida. Por favor, faça login novamente.' 
      })
      navigate('/auth')
      return
    }
    
    setIsLoading(true)

    try {
      // 1. Atualizar Senha no Supabase Auth
      const { error: errorSenha } = await supabase.auth.updateUser({
        password: values.novaSenha,
      })
      if (errorSenha) throw new Error(`Erro ao atualizar senha: ${errorSenha.message}`)

      // 2. Atualizar Nome no Perfil e Marcar como NÃO primeiro acesso
      const { error: errorPerfil } = await supabase
        .from('profiles' as any)
        .update({
          nome: values.nomeCompleto,
          eh_primeiro_acesso: false,
        })
        .eq('user_id', user.id)

      if (errorPerfil) throw new Error(`Erro ao atualizar perfil: ${errorPerfil.message}`)

      toast({ 
        title: 'Sucesso!', 
        description: 'Sua conta foi configurada. Bem-vindo(a)!' 
      })

      // Redireciona para o Dashboard principal
      navigate('/', { replace: true })

    } catch (error: any) {
      console.error('Erro na configuração inicial:', error)
      toast({
        variant: 'destructive',
        title: 'Erro na Configuração',
        description: error.message || 'Não foi possível salvar as alterações. Tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configuração Inicial da Conta</CardTitle>
          <CardDescription>
            Para sua segurança, defina seu nome e uma nova senha.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nomeCompleto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Como você será chamado(a) no sistema" 
                        {...field} 
                        autoComplete="name" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="novaSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Mínimo 6 caracteres" 
                        {...field} 
                        autoComplete="new-password" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Repita a nova senha" 
                        {...field} 
                        autoComplete="new-password" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar e Acessar Sistema
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
