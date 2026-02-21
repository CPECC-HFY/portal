/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkAuditLogs() {
    console.log("Fetching recent audit logs...");
    const { data: logs, error: logsErr } = await supabase
        .from('audit_logs')
        .select('*, user:users(name, role)')
        .order('timestamp', { ascending: false })
        .limit(10);

    if (logsErr) {
        console.error('Error fetching logs:', logsErr);
    } else {
        console.log('Recent Logs:');
        logs.forEach(log => {
            console.log(`[${log.timestamp}] ActorName: ${log.user?.name} | ActorID: ${log.user_id} | Action: ${log.action} | Resource: ${log.resource} | Details: ${log.details}`);
        });
    }

    console.log("\nChecking RLS policies for audit_logs...");
    const { data: policies, error: polErr } = await supabase
        .rpc('get_policies_for_table', { table_name: 'audit_logs' });

    if (polErr) {
        // Fallback to pg_policies
        const { data: pgPolicies, error: pgErr } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'audit_logs');
        console.log('Policies:', pgPolicies || pgErr);
    } else {
        console.log('Policies:', policies);
    }
}

checkAuditLogs();
