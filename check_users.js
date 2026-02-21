/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log("Fetching all users...");
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.table(users.map(u => ({ id: u.id, name: u.name, role: u.role, email: u.email })));
    }
}

checkUsers();
