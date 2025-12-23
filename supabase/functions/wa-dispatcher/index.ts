import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("🚀 Dispatcher iniciado - buscando mensagens na fila");

    // Buscar mensagens pendentes na fila
    const { data: fila, error: filaError } = await supabase
      .from("wa_outbox")
      .select("*")
      .eq("status", "queued")
      .limit(50);

    if (filaError) {
      console.error("❌ Erro ao buscar fila:", filaError);
      return new Response(JSON.stringify({ error: filaError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fila || fila.length === 0) {
      console.log("✅ Nenhuma mensagem na fila");
      return new Response(
        JSON.stringify({ message: "Sem mensagens na fila", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📨 ${fila.length} mensagens encontradas`);

    let processadas = 0;
    let falhadas = 0;

    for (const msg of fila) {
      try {
        console.log(`📤 Processando mensagem ${msg.id} para ${msg.numero}`);

        // Buscar configuração do WhatsApp
        const { data: conta, error: contaError } = await supabase
          .from("wa_configuracoes")
          .select("base_url, apikey, instance_id")
          .eq("tenant_id", msg.tenant_id)
          .eq("ativo", true)
          .single();

        if (contaError || !conta) {
          console.error(`❌ Conta não encontrada para tenant ${msg.tenant_id}`);
          await supabase
            .from("wa_outbox")
            .update({ status: "failed", error_message: "Conta não encontrada" })
            .eq("id", msg.id);
          falhadas++;
          continue;
        }

        // Enviar via Evolution API
        const evolutionUrl = `${conta.base_url}/message/sendText/${conta.instance_id}`;
        
        console.log(`🌐 Enviando para Evolution API: ${evolutionUrl}`);
        
        const response = await fetch(evolutionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": conta.apikey,
          },
          body: JSON.stringify({
            number: msg.numero,
            text: msg.mensagem,
          }),
        });

        const responseData = await response.json();

        if (response.ok) {
          console.log(`✅ Mensagem enviada: ${msg.id}`);

          // Atualizar status na fila
          await supabase
            .from("wa_outbox")
            .update({
              status: "sent",
              enviado_em: new Date().toISOString(),
              response_data: responseData,
            })
            .eq("id", msg.id);

          // Criar registro em wa_messages
          await supabase.from("wa_messages").insert({
            contato_id: msg.contato_id,
            tenant_id: msg.tenant_id,
            direction: "out",
            body: msg.mensagem,
            status: "sent",
            created_at: new Date().toISOString(),
            wa_message_id: responseData.key?.id || null,
          });

          // Auditoria
          await supabase.from("security_audit_log").insert({
            user_id: msg.user_id,
            event_type: "mensagem_enviada",
            event_description: `Mensagem WhatsApp enviada para ${msg.numero}`,
            metadata: {
              contato_id: msg.contato_id,
              mensagem_id: msg.id,
              numero: msg.numero,
            },
          });

          processadas++;
        } else {
          console.error(`❌ Falha ao enviar mensagem ${msg.id}:`, responseData);
          
          await supabase
            .from("wa_outbox")
            .update({
              status: "failed",
              error_message: JSON.stringify(responseData),
            })
            .eq("id", msg.id);

          falhadas++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar mensagem ${msg.id}:`, error);
        
        await supabase
          .from("wa_outbox")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : String(error),
          })
          .eq("id", msg.id);

        falhadas++;
      }
    }

    console.log(`✅ Dispatcher finalizado: ${processadas} enviadas, ${falhadas} falhadas`);

    return new Response(
      JSON.stringify({
        message: "Processamento concluído",
        processed: processadas,
        failed: falhadas,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro geral no dispatcher:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
