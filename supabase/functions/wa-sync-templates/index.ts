import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Enhanced JWT validation with role checking
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate user role and permissions
    const { data: roleValidation } = await supabase
      .rpc('validate_jwt_role', {
        jwt_user_id: user.id,
        required_role: null // Allow all authenticated users
      });

    if (!roleValidation?.valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: roleValidation?.error 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Monitor bulk access for template sync operations
    await supabase.rpc('monitor_bulk_access', {
      user_id_param: user.id,
      operation_type: 'template_sync',
      record_count: 1
    });

    // Get user's WhatsApp accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('wa_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (accountsError) {
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No WhatsApp accounts found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let totalSynced = 0;

    // Sync templates for each account
    for (const account of accounts) {
      // Get and decrypt tokens for the account
      const { data: tokens } = await supabase
        .from('wa_tokens')
        .select('*')
        .eq('account_id', account.id)
        .single();

      if (!tokens) {
        console.log(`No tokens found for account ${account.id}`);
        continue;
      }

      // Decrypt access token for API call
      const { data: decryptedToken } = await supabase
        .rpc('decrypt_whatsapp_token', {
          encrypted_token: tokens.access_token,
          account_id: account.id
        });

      if (!decryptedToken) {
        console.error(`Failed to decrypt token for account ${account.id}`);
        continue;
      }

      // Call Meta's API to get message templates
      const templatesUrl = `https://graph.facebook.com/v18.0/${account.waba_id}/message_templates`;
      const templatesResponse = await fetch(`${templatesUrl}?access_token=${decryptedToken}`);

      if (!templatesResponse.ok) {
        console.error(`Failed to fetch templates for account ${account.id}:`, await templatesResponse.text());
        continue;
      }

      const templatesData = await templatesResponse.json();
      
      if (templatesData.data) {
        // Store templates in database (for now just count them)
        totalSynced += templatesData.data.length;
        
        // TODO: Store templates in wa_templates table when it's created
        console.log(`Synced ${templatesData.data.length} templates for account ${account.id}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        total: totalSynced,
        message: `Synced ${totalSynced} templates`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error syncing templates:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});