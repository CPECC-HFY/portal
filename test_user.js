/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateUser() {
    const { data, error } = await supabase.from('users').insert({
        id: crypto.randomUUID(),
        name: 'Test Setup User',
        email: 'testsetup@example.com',
        role: 'Employee',
        department: 'General',
        status: 'Active',
    });

    console.log('Data:', data);
    console.log('Error:', error);
}

testCreateUser();
