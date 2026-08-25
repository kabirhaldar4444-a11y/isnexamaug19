import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("Authenticating as super admin...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'info@isuccessnode.com',
    password: 'qwerty@123'
  });

  if (authErr) {
    console.error("Auth failed:", authErr.message);
    process.exit(1);
  }
  console.log("Authenticated successfully as:", authData.user.email);

  console.log("\nChecking user profiles table for staffadmin@gmail.com...");
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'staffadmin@gmail.com');
  
  if (profileErr) {
    console.error("Error querying profiles:", profileErr);
  } else {
    console.log("Profiles records for staffadmin:", profileData);
  }

  console.log("\nChecking all profiles in profiles table...");
  const { data: allProfiles, error: allProfilesErr } = await supabase
    .from('profiles')
    .select('id, email, role, full_name');
  if (allProfilesErr) {
    console.error("Error querying all profiles:", allProfilesErr);
  } else {
    console.log("All profiles in DB:", allProfiles);
  }

  process.exit(0);
}

check().catch(err => {
  console.error("Exception:", err);
  process.exit(1);
});
