import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active configurations
    const { data: configs, error } = await supabase
      .from('wa_configuracoes')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching configurations:', error);
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          details: error.message,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ 
          status: 'no_configs',
          message: 'No active WhatsApp configurations found',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check connection status for each instance
    const checks = await Promise.all(
      configs.map(async (cfg) => {
        try {
          console.log(`Checking instance: ${cfg.instance_name} at ${cfg.api_endpoint}`);
          
          const response = await fetch(
            `${cfg.api_endpoint}/instance/connectionState/${cfg.instance_name}`,
            {
              headers: {
                'apikey': cfg.api_key,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error for ${cfg.instance_name}:`, errorText);
            return {
              instance: cfg.instance_name,
              user_id: cfg.user_id,
              online: false,
              error: `HTTP ${response.status}: ${errorText}`,
              timestamp: new Date().toISOString()
            };
          }

          const body = await response.json();
          const isOnline = body?.instance?.state === 'open' || body?.state === 'open';
          
          console.log(`Instance ${cfg.instance_name} status:`, body?.instance?.state || body?.state);

          return {
            instance: cfg.instance_name,
            user_id: cfg.user_id,
            online: isOnline,
            state: body?.instance?.state || body?.state || 'unknown',
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error checking instance ${cfg.instance_name}:`, error);
          return {
            instance: cfg.instance_name,
            user_id: cfg.user_id,
            online: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          };
        }
      })
    );

    const allOnline = checks.every(c => c.online);
    const onlineCount = checks.filter(c => c.online).length;

    // Log healthcheck results
    await supabase.from('auditorias').insert({
      actor: null,
      action: 'healthcheck',
      target: 'whatsapp_integration',
      module: 'whatsapp',
      tenant_id: null,
      payload: {
        total_instances: checks.length,
        online_count: onlineCount,
        all_online: allOnline,
        checks: checks
      }
    });

    return new Response(
      JSON.stringify({
        status: allOnline ? 'healthy' : 'degraded',
        total_instances: checks.length,
        online_count: onlineCount,
        offline_count: checks.length - onlineCount,
        checks: checks,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Healthcheck error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
