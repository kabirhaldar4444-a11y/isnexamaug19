import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpmzigojfwqiffleligg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXppZ29qZndxaWZmbGVsaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzg1ODEsImV4cCI6MjA5NjY1NDU4MX0.WPrgf0AjwV9D2Bbs45CcZa8eHoxaugVvNAV1zSrNBXc';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function runQuery(sql) {
  const { data, error } = await supabase.rpc('debug_run_query', { query_text: sql });
  if (error) {
    console.error("RPC Error:", error);
    return null;
  }
  if (data && data.error) {
    console.error("SQL Error:", data.error);
    return null;
  }
  return data;
}

async function run() {
  await supabase.auth.signInWithPassword({
    email: 'info@isuccessnode.com',
    password: 'qwerty@123'
  });

  console.log("=== TABLES IN auth SCHEMA ===");
  const tables = await runQuery(`
    SELECT tablename 
    FROM pg_catalog.pg_tables 
    WHERE schemaname = 'auth'
  `);
  console.log(JSON.stringify(tables, null, 2));

  await supabase.auth.signOut();
}

run();
