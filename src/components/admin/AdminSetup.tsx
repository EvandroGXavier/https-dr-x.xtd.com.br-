import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, UserPlus } from 'lucide-react';

export function AdminSetup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase
        .rpc('create_first_admin', { user_email: email });

      if (rpcError) {
        throw rpcError;
      }

      toast({
        title: "Admin criado com sucesso!",
        description: `O usuário ${email} agora é administrador do sistema.`,
      });

      setEmail('');
    } catch (err: any) {
      console.error('Error creating admin:', err);
      
      if (err.message?.includes('Admin users already exist')) {
        setError('Já existem usuários administradores no sistema. Use a função de alteração de papel em Configurações.');
      } else if (err.message?.includes('not found')) {
        setError('Usuário não encontrado. Certifique-se de que o email está correto e que o usuário já se cadastrou.');
      } else {
        setError('Erro ao criar administrador. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="flex items-center gap-2 justify-center">
          <UserPlus className="h-5 w-5" />
          Configuração Inicial
        </CardTitle>
        <CardDescription>
          Crie o primeiro administrador do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email do Usuário</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              O usuário deve já ter se cadastrado no sistema
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Criando...' : 'Criar Administrador'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}