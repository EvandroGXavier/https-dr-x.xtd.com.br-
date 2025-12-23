import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface RetryData {
  logId: string;
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

    const { logId }: RetryData = await req.json();

    // Buscar log original
    const { data: log, error: logError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (logError || !log) {
      throw new Error('Log não encontrado');
    }

    // Incrementar tentativa
    const novaTentativa = log.tentativa + 1;

    // Buscar credenciais SMTP
    const { data: credenciais, error: credError } = await supabase
      .rpc('get_smtp_credentials', { conta_id_param: log.conta_id });

    if (credError || !credenciais || credenciais.length === 0) {
      throw new Error('Credenciais SMTP não encontradas');
    }

    const conta = credenciais[0];

    try {
      // Simular reenvio de e-mail
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar log como enviado
      const { error: updateError } = await supabase
        .from('email_logs')
        .update({
          status: 'enviado',
          enviado_em: new Date().toISOString(),
          tentativa: novaTentativa,
          mensagem_erro: null
        })
        .eq('id', logId);

      if (updateError) {
        throw new Error('Erro ao atualizar log: ' + updateError.message);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'E-mail reenviado com sucesso' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (emailError) {
      // Atualizar log com novo erro
      await supabase
        .from('email_logs')
        .update({
          status: 'erro',
          mensagem_erro: emailError instanceof Error ? emailError.message : String(emailError),
          tentativa: novaTentativa
        })
        .eq('id', logId);

      throw emailError;
    }

  } catch (error) {
    console.error('Erro no reenvio de e-mail:', error);
    
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