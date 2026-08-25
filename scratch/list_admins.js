import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ofreovntpydtzyeebjrv.supabase.co';
// Using the service role or a key that can read profiles
const supabaseKey = 'EXAM_PORTAL_KEY_PLACEHOLDER'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAdmins() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name, role')
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching admins:', error);
    return;
  }

  console.log('--- ADMINS LIST ---');
  data.forEach(admin => {
    console.log(`- ${admin.full_name || 'No Name'} (${admin.email}) [Role: ${admin.role}]`);
  });
  
  // Also check for the master hardcoded email which might not be in the results if role isn't 'admin' there
  console.log('- Master Admin: info@isuccessnode.com');
}

listAdmins();
