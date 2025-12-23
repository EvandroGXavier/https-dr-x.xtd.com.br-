import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar JWT e obter usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Permitir que qualquer usuário autenticado crie contas WhatsApp

    if (req.method === 'GET') {
      // Listar contas WhatsApp
      const { data: accounts, error } = await supabaseClient
        .from('whatsapp_accounts')
        .select(`
          id,
          nome,
          numero_display,
          status,
          last_connected_at,
          retention_days,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ accounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Criar nova conta WhatsApp
      console.log('POST request received');

      const { nome, empresa_id, filial_id } = await req.json();
      console.log('Request data:', { nome, empresa_id, filial_id, user_id: user.id });

      if (!nome) {
        return new Response(
          JSON.stringify({ error: 'Nome is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: account, error } = await supabaseClient
        .from('whatsapp_accounts')
        .insert({
          nome,
          empresa_id: null,
          filial_id: null,
          created_by: user.id,
          user_id: user.id,
          status: 'offline'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Account created successfully:', account);

      // Log evento de auditoria - removido temporariamente para debug
      /* await supabaseClient
        .from('whatsapp_events_audit')
        .insert({
          account_id: account.id,
          empresa_id: null,
          filial_id: null,
          event: 'ACCOUNT_CREATED',
          details: { nome },
          user_id: user.id
        }); */

      return new Response(
        JSON.stringify({ success: true, account }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});