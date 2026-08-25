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
  console.log("Logging in as admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'info@isuccessnode.com',
    password: 'qwerty@123'
  });

  if (authError) {
    console.error("Admin Login Failed:", authError.message);
    return;
  }

  console.log("Logged in successfully. Fetching profiles...");
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, profile_completed');

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError.message);
  } else {
    console.log("Profiles count:", profiles.length);
    console.log("All profiles:\n", JSON.stringify(profiles, null, 2));

    const user02 = profiles.find(p => p.email === 'user02@gmail.com');
    if (user02) {
      console.log("\nFound user02@gmail.com profile:");
      console.log(JSON.stringify(user02, null, 2));
    } else {
      console.log("\nuser02@gmail.com was NOT found in profiles table.");
    }
  }
}

check();
