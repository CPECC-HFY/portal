/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function getPolicies() {
    const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'users' });
    if (error) {
        console.log("Failed to use RPC. Attempting query via pg_policies...");
        const { data: policies, error: polErr } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'users');

        console.log('Policies via pg_policies:', policies);
        console.log('Error:', polErr);
    } else {
        console.log('Policies via RPC:', data);
    }
}

getPolicies();
