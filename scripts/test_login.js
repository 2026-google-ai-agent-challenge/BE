const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('admins')
    .insert([{ id: 'admin_road', password: '1234', department: '도로과' }]);

  console.log('Insert Data:', data);
  console.log('Insert Error:', error);
}

test();
