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

const url1 = env.VITE_SUPABASE_URL; // dpmzigojfwqiffleligg
const key1 = env.VITE_SUPABASE_ANON_KEY;
const url2 = 'https://dtpqjxwvugqncpmtuumv.supabase.co';
const url3 = 'https://wwlvrohowziiejnuykij.supabase.co';

console.log("URL 1:", url1);
console.log("URL 2:", url2);
console.log("URL 3:", url3);

async function testUrl(url, key, name) {
  console.log(`\nTesting ${name}: ${url}`);
  const client = createClient(url, key);
  try {
    const { data, error } = await client.from('exams').select('*').limit(1);
    if (error) {
      console.log(`${name} exams query error:`, error.message);
    } else {
      console.log(`${name} exams query success:`, data);
    }
  } catch (err) {
    console.log(`${name} exception:`, err.message);
  }
}

async function run() {
  await testUrl(url1, key1, "ENV URL");
  // Let's also try to fetch with key1 on url2 and url3 in case they use the same anon key pattern or it works
  await testUrl(url2, key1, "Vite Proxy URL");
  process.exit(0);
}

run();
