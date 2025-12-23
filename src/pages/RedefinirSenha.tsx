import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const senhaSchema = z.object({
  novaSenha: z.string()
    .min(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
    .regex(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula.' })
    .regex(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula.' })
    .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número.' })
    .regex(/[^A-Za-z0-9]/, { message: 'A senha deve conter pelo menos um caractere especial.' }),
  confirmarSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não coincidem.',
  path: ['confirmarSenha'],
})

export default function RedefinirSenha() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const form = useForm<z.infer<typeof senhaSchema>>({
    resolver: zodResolver(senhaSchema),
    defaultValues: {
      novaSenha: '',
      confirmarSenha: '',
    },
  })

  useEffect(() => {
    // Verifica se há um token de recuperação válido
    const checkRecoveryToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Usuário tem uma sessão ativa, pode redefinir senha
          setIsValidToken(true)
        } else {
          // Sem sessão, redireciona para login
          toast({
            variant: 'destructive',
            title: 'Link inválido ou expirado',
            description: 'Por favor, solicite um novo link de recuperação de senha.',
          })
          setTimeout(() => navigate('/auth'), 2000)
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error)
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível validar o link de recuperação.',
        })
        setTimeout(() => navigate('/auth'), 2000)
      } finally {
        setCheckingToken(false)
      }
    }

    checkRecoveryToken()
  }, [navigate, toast])

  async function onSubmit(values: z.infer<typeof senhaSchema>) {
    setIsLoading(true)

    try {
      // Atualiza a senha usando o token de recuperação
      const { error } = await supabase.auth.updateUser({
        password: values.novaSenha,
      })

      if (error) {
        // Tratamento específico para erro de senha igual à antiga
        if (error.message.includes('same') || error.message.includes('different')) {
          toast({
            variant: 'destructive',
            title: 'Senha inválida',
            description: 'A nova senha deve ser diferente da senha anterior. Escolha uma senha que você não tenha usado antes.',
          })
        } else {
          throw error
        }
        return
      }

      toast({
        title: 'Senha redefinida com sucesso!',
        description: 'Você será redirecionado para o login.',
      })

      // Faz logout para forçar novo login com a nova senha
      await supabase.auth.signOut()

      setTimeout(() => {
        navigate('/auth')
      }, 2000)

    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao redefinir senha',
        description: error.message || 'Não foi possível redefinir sua senha. Tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando link de recuperação...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>
                Link inválido ou expirado. Você será redirecionado...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Escolha uma nova senha segura para sua conta.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Importante:</strong> A nova senha deve ser diferente da sua senha anterior.
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="novaSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          {...field}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
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
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repita a nova senha"
                          {...field}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redefinir Senha
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
