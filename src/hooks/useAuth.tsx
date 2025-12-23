import { useState, useEffect, createContext, useContext, ReactNode, startTransition } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logAuthAttempt } from '@/lib/securityMonitor';
import { SessionSecurityManager } from '@/lib/sessionSecurity';
import { authSecurity } from '@/lib/authSecurity';

interface Profile {
  profile_id: string;
  user_id: string;
  nome: string;
  email: string;
  celular?: string;
  role: 'admin' | 'user';
  empresa_id?: string;  // UUID
  filial_id?: string;   // UUID
  sip_ramal?: string;
  sip_senha?: string;
  sip_host?: string;
  sip_status?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string, celular?: string) => Promise<{ error: any; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Enhanced security monitoring
  const [sessionManager, setSessionManager] = useState<SessionSecurityManager | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      // Profile data will be set even if empresa/filial are not configured yet
      // The Auth page will handle redirecting to wizard if needed
      
      startTransition(() => {
        setProfile(data);
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      startTransition(() => {
        setProfile(null);
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        startTransition(() => {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setTimeout(() => {
              fetchProfile(session.user.id);
            }, 0);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        });
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      startTransition(() => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
        }
        
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirecionamento para configuração inicial (primeiro acesso)
  useEffect(() => {
    if (!user || !profile || loading) return;

    const currentPath = window.location.pathname;
    
    // Se está marcado para primeiro acesso E não está na página de configuração
    if ((profile as any).eh_primeiro_acesso === true && currentPath !== '/configuracao-inicial') {
      console.log('Primeiro acesso detectado, redirecionando para /configuracao-inicial...');
      window.location.href = '/configuracao-inicial';
    }
    // Se está na página de config mas já configurou, redireciona para home
    else if ((profile as any).eh_primeiro_acesso === false && currentPath === '/configuracao-inicial') {
      console.log('Usuário já configurado, redirecionando para /...');
      window.location.href = '/';
    }
  }, [user, profile, loading]);

  // Enhanced security monitoring with session management
  useEffect(() => {
    if (!user) {
      if (sessionManager) {
        sessionManager.stop();
        setSessionManager(null);
      }
      return;
    }

    // Create enhanced session manager
    const manager = new SessionSecurityManager(
      {
        maxIdleTime: 30 * 60 * 1000, // 30 minutes
        maxSessionTime: 8 * 60 * 60 * 1000, // 8 hours
        activityCheckInterval: 5 * 60 * 1000, // 5 minutes
        suspiciousActivityThreshold: 100 // 100ms
      },
      () => {
        // Session expired callback
        signOut();
      }
    );

    manager.start();
    setSessionManager(manager);

    return () => {
      manager.stop();
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authSecurity.secureSignIn(email, password);
      
      if (!result.success) {
        return { error: new Error(result.error || 'Sign in failed') };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, nome: string, celular?: string) => {
    try {
      const userData = { nome, celular };
      const result = await authSecurity.secureSignUp(email, password, userData);
      
      if (!result.success) {
        return { error: new Error(result.error || 'Sign up failed'), user: null };
      }

      // Buscar o usuário recém-criado
      const { data: { user: newUser } } = await supabase.auth.getUser();

      return { error: null, user: newUser };
    } catch (error) {
      return { error, user: null };
    }
  };

  const signOut = async () => {
    try {
      // Force expire current session
      if (sessionManager) {
        sessionManager.forceExpire();
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { logAuthAttempt } = await import('@/lib/securityMonitor');
      
      // Log password reset attempt
      await logAuthAttempt('password_reset_attempt', email);
      
      const redirectUrl = `${window.location.origin}/redefinir-senha`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        await logAuthAttempt('password_reset_attempt', email, false, error.message);
      } else {
        await logAuthAttempt('password_reset_attempt', email, true);
      }

      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  // ⚠️ DEPRECATED: Não use isAdmin do contexto - use useHasRole('admin') nos componentes
  // Mantido temporariamente para compatibilidade, mas será removido
  const isAdmin = false; // Forçado a false - use useHasRole()

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}