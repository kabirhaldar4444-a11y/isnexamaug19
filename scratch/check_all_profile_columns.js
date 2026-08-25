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
  // Try to select columns from profiles to see which ones fail
  const cols = [
    'signature_url',
    'pan_url',
    'disclaimer_accepted',
    'ip_address',
    'is_exam_locked'
  ];

  for (const col of cols) {
    const { data, error } = await supabase
      .from('profiles')
      .select(col)
      .limit(1);
    if (error) {
      console.log(`Column ${col}: NOT FOUND (${error.message})`);
    } else {
      console.log(`Column ${col}: EXISTS`);
    }
  }
}

check();
