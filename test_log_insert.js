/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testLog() {
    console.log("Attempting manual log insert...");
    const actorId = '8cb10478-d627-4550-b9dc-9debfacc5795'; // Murtadha Hassan
    const details = JSON.stringify({ name: 'Test User', role: 'Employee' });

    const { data, error } = await supabaseAdmin.from('audit_logs').insert({
        user_id: actorId,
        action: 'Create',
        resource: 'User',
        details: details
    }).select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);
    }
}

testLog();
