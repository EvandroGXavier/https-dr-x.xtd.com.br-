import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface EvolutionClient {
  baseUrl: string;
  apiKey: string;
}

class EvolutionAPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async createInstance(instanceName: string) {
    return this.makeRequest('POST', '/instance/create', {
      instanceName,
      qrcode: true,
      webhook: false
    });
  }

  async getConnectionState(instanceName: string) {
    return this.makeRequest('GET', `/instance/connectionState/${instanceName}`);
  }

  async generateQrCode(instanceName: string) {
    return this.makeRequest('GET', `/instance/connect/${instanceName}`);
  }

  async logout(instanceName: string) {
    return this.makeRequest('DELETE', `/instance/logout/${instanceName}`);
  }

  async deleteInstance(instanceName: string) {
    return this.makeRequest('DELETE', `/instance/delete/${instanceName}`);
  }
}

serve(async (req) => {
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

    // Buscar configuração do usuário no banco
    const { data: userConfig, error: cfgError } = await supabaseClient
      .from('wa_configuracoes')
      .select('api_endpoint, api_key, instance_name, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (cfgError) {
      console.error('Config fetch error for user', user.id, cfgError.message);
    }

    if (!userConfig?.api_endpoint || !userConfig?.api_key) {
      console.error('User config missing for user:', user.id, 'config:', userConfig);
      return new Response(
        JSON.stringify({ error: 'Evolution API configuration not found. Please configure WhatsApp settings first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar URL base
    if (!userConfig.api_endpoint.startsWith('http://') && !userConfig.api_endpoint.startsWith('https://')) {
      console.error('Invalid API endpoint format:', userConfig.api_endpoint);
      return new Response(
        JSON.stringify({ error: 'Invalid API endpoint format. Must start with http:// or https://', endpoint: userConfig.api_endpoint }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEndpoint = userConfig.api_endpoint.replace(/\/+$/, '');
    console.log('Using Evolution API:', normalizedEndpoint, 'for user:', user.id);
    const evolutionClient = new EvolutionAPIClient(normalizedEndpoint, userConfig.api_key);
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const instanceName = url.searchParams.get('instance');

    if (req.method === 'GET') {
      if (action === 'connectionState' && instanceName) {
        try {
          console.log(`Checking connection state for instance: ${instanceName} at ${userConfig.api_endpoint}`);
          const state = await evolutionClient.getConnectionState(instanceName);
          console.log(`Connection state result:`, state);
          return new Response(
            JSON.stringify({ state }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error(`Connection state check failed for ${instanceName}:`, error);
          return new Response(
            JSON.stringify({ 
              state: { instance: { state: 'close' } },
              error: error instanceof Error ? error.message : String(error)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      if (action === 'qrcode' && instanceName) {
        const qrData = await evolutionClient.generateQrCode(instanceName);
        return new Response(
          JSON.stringify({ qrcode: qrData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action or missing parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (action === 'create') {
        const { name, instanceName: requestInstanceName } = body;
        
        // Criar instância no Evolution
        const instanceResult = await evolutionClient.createInstance(requestInstanceName);
        
        // Salvar no banco
        const { data: account, error } = await supabaseClient
          .from('wa_contas')
          .insert({
            user_id: user.id,
            display_name: name,
            nome_instancia: requestInstanceName,
            status: 'CONNECTING'
          })
          .select()
          .single();

        if (error) {
          await evolutionClient.deleteInstance(requestInstanceName);
          throw error;
        }

        return new Response(
          JSON.stringify({ success: true, account, evolution: instanceResult }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'logout' && instanceName) {
        await evolutionClient.logout(instanceName);
        
        // Atualizar status no banco
        await supabaseClient
          .from('wa_contas')
          .update({ status: 'DISCONNECTED', phone_number: null })
          .eq('nome_instancia', instanceName)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});