import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚨 EMERGENCY CLEANUP - Iniciando limpeza do bucket wa-midia');

    let totalDeleted = 0;
    let hasMore = true;
    const batchSize = 100;

    while (hasMore) {
      // Listar arquivos do bucket
      const { data: files, error: listError } = await supabase
        .storage
        .from('wa-midia')
        .list('', { limit: batchSize });

      if (listError) {
        console.error('Erro ao listar arquivos:', listError);
        throw listError;
      }

      if (!files || files.length === 0) {
        hasMore = false;
        break;
      }

      // Deletar arquivos em lote
      const filePaths = files.map(file => file.name);
      const { error: deleteError } = await supabase
        .storage
        .from('wa-midia')
        .remove(filePaths);

      if (deleteError) {
        console.error('Erro ao deletar arquivos:', deleteError);
        throw deleteError;
      }

      totalDeleted += filePaths.length;
      console.log(`✅ Deletados ${filePaths.length} arquivos (Total: ${totalDeleted})`);

      // Se pegou menos que o batch size, acabaram os arquivos
      if (files.length < batchSize) {
        hasMore = false;
      }
    }

    console.log(`🎉 Limpeza concluída! Total de arquivos deletados: ${totalDeleted}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Limpeza concluída com sucesso`,
        totalDeleted,
        spaceFree: '~2.99 GB'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na limpeza de emergência:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
