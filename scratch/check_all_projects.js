import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env
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

const projects = [
  {
    name: "Env Project (.env)",
    url: env.VITE_SUPABASE_URL,
    key: env.VITE_SUPABASE_ANON_KEY
  },
  {
    name: "check_columns_v3.js Project",
    url: "https://wwlvrohowziiejnuykij.supabase.co",
    key: "sb_publishable_EpvDw8A3_2dD_iwCtKyIVA_vaRuC9c7" // wait, is this key valid?
  }
];

async function checkProject(proj) {
  console.log(`Checking ${proj.name} (${proj.url})...`);
  try {
    const supabase = createClient(proj.url, proj.key);
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.log(`  Error: ${error.message}`);
    } else {
      console.log(`  Success! Profiles:`, data);
      // Let's check columns by selecting specific ones
      const cols = ['disclaimer_accepted', 'pan_url', 'signature_url'];
      for (const col of cols) {
        const { error: colErr } = await supabase.from('profiles').select(col).limit(1);
        if (colErr) {
          console.log(`    Column ${col}: NOT FOUND`);
        } else {
          console.log(`    Column ${col}: EXISTS`);
        }
      }
    }
  } catch (err) {
    console.log(`  Exception: ${err.message}`);
  }
}

async function run() {
  for (const proj of projects) {
    await checkProject(proj);
  }
}

run();
