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
  console.log("Querying profile for user03@gmail.com...");
  const { data: user03, error: err03 } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'user03@gmail.com');
  
  if (err03) {
    console.error('Error user03:', err03);
  } else {
    console.log('user03 profile:', user03);
  }

  console.log("Querying profile for user21@gmail.com...");
  const { data: user21, error: err21 } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'user21@gmail.com');
  
  if (err21) {
    console.error('Error user21:', err21);
  } else {
    console.log('user21 profile:', user21);
  }

  process.exit(0);
}

check().catch(err => {
  console.error("Exception:", err);
  process.exit(1);
});
