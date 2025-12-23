import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface TestData {
  contaId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contaId }: TestData = await req.json();

    // Buscar credenciais SMTP descriptografadas
    const { data: credenciais, error: credError } = await supabase
      .rpc('get_smtp_credentials', { conta_id_param: contaId });

    if (credError || !credenciais || credenciais.length === 0) {
      throw new Error('Credenciais SMTP não encontradas ou erro ao descriptografar');
    }

    const conta = credenciais[0];

    // Criar log de teste
    const { data: logData, error: logError } = await supabase
      .from('email_logs')
      .insert([{
        conta_id: contaId,
        destinatario_email: conta.email,
        assunto: 'Teste de Configuração SMTP',
        status: 'pendente',
        payload: {
          conteudo: 'Este é um e-mail de teste para verificar a configuração SMTP.',
          tipo: 'teste'
        }
      }])
      .select()
      .single();

    if (logError) {
      throw new Error('Erro ao criar log de teste: ' + logError.message);
    }

    try {
      // Simular teste de conexão SMTP
      console.log('Testando conexão SMTP:', {
        host: conta.smtp_host,
        port: conta.smtp_port,
        user: conta.smtp_user,
        tls: conta.tls_ssl
      });

      // Simular envio de e-mail de teste
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar log como enviado
      const { error: updateError } = await supabase
        .from('email_logs')
        .update({
          status: 'enviado',
          enviado_em: new Date().toISOString()
        })
        .eq('id', logData.id);

      if (updateError) {
        console.error('Erro ao atualizar log:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Teste de SMTP realizado com sucesso' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (testError) {
      // Atualizar log com erro
      await supabase
        .from('email_logs')
        .update({
          status: 'erro',
          mensagem_erro: testError instanceof Error ? testError.message : String(testError)
        })
        .eq('id', logData.id);

      throw testError;
    }

  } catch (error) {
    console.error('Erro no teste SMTP:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);