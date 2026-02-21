/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpLogs() {
    console.log("--- DUMPING LAST 20 AUDIT LOGS ---");
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('timestamp, action, resource, details, user_id, user:users(name, role)')
        .order('timestamp', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    logs.forEach(log => {
        console.log(`TIME: ${log.timestamp}`);
        console.log(`ACTOR: ${log.user?.name || 'NULL'} (ID: ${log.user_id})`);
        console.log(`ACTION: ${log.action} | RESOURCE: ${log.resource}`);
        console.log(`DETAILS: ${log.details}`);
        console.log("-----------------------------------");
    });
}

dumpLogs();
