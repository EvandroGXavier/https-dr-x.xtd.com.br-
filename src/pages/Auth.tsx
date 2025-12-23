import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authRateLimiter, validatePassword } from '@/lib/security';
import { CadastroEmpresaWizard } from '@/components/security/CadastroEmpresaWizard';

const Auth = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', nome: '', celular: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signIn, signUp, resetPassword, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Emergency cleanup hotkey (Ctrl + Alt + F8)
  useEffect(() => {
    const handleEmergencyCleanup = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'F8') {
        e.preventDefault();

        const confirmCleanup = window.confirm(
          '🚨 LIMPEZA DE EMERGÊNCIA\n\n' +
          'Isso irá DELETAR PERMANENTEMENTE todos os 2048 arquivos (2.99 GB) do bucket wa-midia.\n\n' +
          'Esta ação NÃO pode ser desfeita!\n\n' +
          'Deseja continuar?'
        );

        if (!confirmCleanup) return;

        toast({
          title: "🚨 Iniciando limpeza de emergência...",
          description: "Aguarde enquanto deletamos os arquivos do bucket wa-midia",
        });

        try {
          const response = await fetch(
            'https://api.dr-x.xtd.com.br/functions/v1/emergency-cleanup',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraWJ0dXRydXlieHBkbWppY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjczMTgsImV4cCI6MjA3MTA0MzMxOH0.q7zddEDqiy9EjAcTAg5EMoFn3B7D3YtJv0oMdpK8Y4w',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraWJ0dXRydXlieHBkbWppY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjczMTgsImV4cCI6MjA3MTA0MzMxOH0.q7zddEDqiy9EjAcTAg5EMoFn3B7D3YtJv0oMdpK8Y4w',
              },
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();

          if (result.success) {
            toast({
              title: "✅ Limpeza concluída!",
              description: `${result.totalDeleted} arquivos deletados. Espaço liberado: ${result.spaceFree}`,
              duration: 10000,
            });
          } else {
            throw new Error(result.error || 'Erro desconhecido');
          }
        } catch (error: any) {
          toast({
            title: "❌ Erro na limpeza",
            description: error.message || 'Não foi possível completar a limpeza',
            variant: "destructive",
            duration: 8000,
          });
        }
      }
    };

    window.addEventListener('keydown', handleEmergencyCleanup);
    return () => window.removeEventListener('keydown', handleEmergencyCleanup);
  }, [toast]);

  // Check if user needs to configure empresa/filial
  useEffect(() => {
    if (user && profile && !authLoading) {
      const hasEmpresa = Boolean(profile.empresa_id);
      const hasFilial = Boolean(profile.filial_id);
      const needsConfiguration = !(hasEmpresa && hasFilial);

      if (needsConfiguration) {
        // Show wizard if empresa/filial not configured
        setNewUser(user);
        setShowWizard(true);
      } else {
        // Navigate to main page if already configured
        navigate('/');
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!loginData.email || !loginData.password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    // Normalizar email
    const email = loginData.email.trim().toLowerCase();
    const password = loginData.password;

    const { error } = await signIn(email, password);

    if (error) {
      console.warn('Supabase login error:', error?.message || error);

      // Mensagens específicas de erro
      if (/Too many attempts|rate limit/i.test(error.message)) {
        setError(error.message); // Já inclui tempo restante
      } else if (/Invalid login credentials/i.test(error.message)) {
        setError('Email ou senha inválidos.');
      } else if (/Email not confirmed|not confirmed/i.test(error.message)) {
        setError('Seu email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.');
      } else {
        setError(`Erro: ${error.message}`);
      }
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao DR. ADV.",
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!signupData.email || !signupData.password || !signupData.nome || !signupData.celular || !signupData.confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(signupData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '));
      setLoading(false);
      return;
    }

    // Verificar se email já existe
    const { data: emailExists } = await supabase.rpc('check_email_exists', {
      p_email: signupData.email
    });

    if (emailExists) {
      setError('Este email já está cadastrado. Faça login ou use outro email.');
      setLoading(false);
      return;
    }

    const result = await signUp(signupData.email, signupData.password, signupData.nome, signupData.celular);
    const { error, user: createdUser } = result;

    if (error) {
      console.error('Signup error:', error);

      if (error.message.includes('User already registered')) {
        setError('Este email já está cadastrado. Faça login ou use outro email.');
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        setError('Aguarde alguns segundos antes de tentar novamente.');
      } else if (error.message.includes('Email not confirmed')) {
        toast({
          title: "Confirme seu email",
          description: "Verifique sua caixa de entrada e confirme seu email antes de fazer login.",
          duration: 8000,
        });
      } else {
        setError('Erro ao criar conta: ' + error.message);
      }
    } else {
      // Mostrar wizard de configuração de empresa
      if (createdUser) {
        setNewUser(createdUser);
        setShowWizard(true);
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar o cadastro e depois configure sua empresa.",
          duration: 8000,
        });
      } else {
        // Se não retornou usuário, avisar sobre confirmação de email
        toast({
          title: "Cadastro iniciado!",
          description: "Verifique seu email para confirmar o cadastro. Depois retorne aqui para configurar sua empresa.",
          duration: 10000,
        });
      }
    }

    setLoading(false);
  };

  const handleWizardSuccess = () => {
    toast({
      title: "Configuração concluída!",
      description: "Redirecionando para o sistema...",
    });
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!forgotPasswordEmail) {
      setError('Por favor, digite seu email.');
      setLoading(false);
      return;
    }

    // Normalizar email
    const email = forgotPasswordEmail.trim().toLowerCase();

    const { error } = await resetPassword(email);

    if (error) {
      setError('Erro ao enviar email de recuperação. Verifique se o email está correto.');
    } else {
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    }

    setLoading(false);
  };

  // Se usuário acabou de se cadastrar, mostrar wizard
  if (showWizard && newUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <CadastroEmpresaWizard user={newUser} onSuccess={handleWizardSuccess} />
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Recuperar Senha</CardTitle>
            <CardDescription>Digite seu email para receber as instruções</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Email de Recuperação'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={loading}
                >
                  Voltar ao Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">DR. ADV</CardTitle>
          <CardDescription>Sistema Jurídico Seguro</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      disabled={loading}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={loading}
                >
                  Esqueci minha senha
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome Completo</Label>
                  <Input
                    id="signup-nome"
                    type="text"
                    value={signupData.nome}
                    onChange={(e) => setSignupData({ ...signupData, nome: e.target.value })}
                    placeholder="Seu nome completo"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="seu@email.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-celular">Celular/WhatsApp</Label>
                    <Input
                      id="signup-celular"
                      type="tel"
                      value={signupData.celular}
                      onChange={(e) => setSignupData({ ...signupData, celular: e.target.value })}
                      placeholder="(11) 99999-9999"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder="••••••••"
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      disabled={loading}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar Conta
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;