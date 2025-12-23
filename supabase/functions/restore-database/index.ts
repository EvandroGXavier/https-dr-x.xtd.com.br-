import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { backupData, confirm } = await req.json();

    if (!confirm) {
      throw new Error('Confirmation required for restore operation');
    }

    console.log('Starting database restore for admin user:', user.id);

    // Validate backup data structure
    if (!backupData || !backupData.metadata || !backupData.data) {
      throw new Error('Invalid backup file format');
    }

    // Log the restore operation
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        event_type: 'database_restore_start',
        event_description: 'Database restore operation initiated',
        metadata: {
          backup_version: backupData.metadata.version,
          backup_created_at: backupData.metadata.created_at,
          original_creator: backupData.metadata.created_by
        }
      });

    const restoreResults: any = {
      metadata: {
        restored_at: new Date().toISOString(),
        restored_by: user.id,
        original_backup: backupData.metadata
      },
      tables: {}
    };

    // Restore data to each table (excluding sensitive system tables)
    const restorableTables = Object.keys(backupData.data).filter(table => 
      !['security_audit_log', 'backup_history'].includes(table)
    );

    for (const tableName of restorableTables) {
      try {
        const tableData = backupData.data[tableName];
        
        if (!tableData || !tableData.records || tableData.records.length === 0) {
          console.log(`Skipping empty table: ${tableName}`);
          restoreResults.tables[tableName] = { status: 'skipped', reason: 'empty' };
          continue;
        }

        console.log(`Restoring table: ${tableName} (${tableData.records.length} records)`);

        // Delete existing data (except system critical data)
        if (tableName !== 'profiles') {
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .neq('user_id', user.id); // Keep admin's own data

          if (deleteError) {
            console.error(`Error clearing ${tableName}:`, deleteError);
          }
        }

        // Insert backup data in batches
        const batchSize = 100;
        const records = tableData.records;
        let insertedCount = 0;

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          const { data: insertData, error: insertError } = await supabase
            .from(tableName)
            .insert(batch)
            .select();

          if (insertError) {
            console.error(`Batch insert error for ${tableName}:`, insertError);
            // Continue with next batch
          } else {
            insertedCount += insertData?.length || 0;
          }
        }

        restoreResults.tables[tableName] = {
          status: 'completed',
          records_restored: insertedCount,
          total_records: records.length
        };

        console.log(`Successfully restored ${tableName}: ${insertedCount}/${records.length} records`);

      } catch (err) {
        console.error(`Exception restoring ${tableName}:`, err);
        restoreResults.tables[tableName] = {
          status: 'error',
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }

    // Log the completion
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        event_type: 'database_restore_complete',
        event_description: 'Database restore operation completed',
        metadata: restoreResults
      });

    console.log('Database restore completed');

    return new Response(JSON.stringify({
      success: true,
      results: restoreResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database restore error:', error);
    
    // Log the error
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const authHeader = req.headers.get('Authorization');
      
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (user) {
          await supabase
            .from('security_audit_log')
            .insert({
              user_id: user.id,
              event_type: 'database_restore_error',
              event_description: 'Database restore operation failed',
              metadata: { error: error instanceof Error ? error.message : String(error) }
            });
        }
      }
    } catch (logError) {
      console.error('Failed to log restore error:', logError);
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});