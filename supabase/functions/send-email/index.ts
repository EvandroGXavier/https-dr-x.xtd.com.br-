import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface EmailData {
  contaId: string;
  destinatarioEmail: string;
  assunto: string;
  conteudo: string;
  contatoId?: string;
  triggerId?: string;
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

    const { contaId, destinatarioEmail, assunto, conteudo, contatoId, triggerId }: EmailData = await req.json();

    // Buscar credenciais SMTP descriptografadas
    const { data: credenciais, error: credError } = await supabase
      .rpc('get_smtp_credentials', { conta_id_param: contaId });

    if (credError || !credenciais || credenciais.length === 0) {
      throw new Error('Credenciais SMTP não encontradas ou erro ao descriptografar');
    }

    const conta = credenciais[0];

    // Criar log de envio
    const { data: logData, error: logError } = await supabase
      .from('email_logs')
      .insert([{
        trigger_id: triggerId,
        contato_id: contatoId,
        conta_id: contaId,
        destinatario_email: destinatarioEmail,
        assunto: assunto,
        status: 'pendente',
        payload: {
          conteudo: conteudo,
          smtp_host: conta.smtp_host,
          smtp_port: conta.smtp_port
        }
      }])
      .select()
      .single();

    if (logError) {
      throw new Error('Erro ao criar log de envio: ' + logError.message);
    }

    try {
      // Simular envio de e-mail (aqui você integraria com um serviço real como Resend)
      // Por enquanto, vamos apenas marcar como enviado após um delay
      await new Promise(resolve => setTimeout(resolve, 1000));

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
          message: 'E-mail enviado com sucesso',
          logId: logData.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (emailError) {
      // Atualizar log com erro
      await supabase
        .from('email_logs')
        .update({
          status: 'erro',
          mensagem_erro: emailError instanceof Error ? emailError.message : String(emailError)
        })
        .eq('id', logData.id);

      throw emailError;
    }

  } catch (error) {
    console.error('Erro no envio de e-mail:', error);
    
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