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

  console.log("=== ALL TRIGGERS ===");
  const triggers = await runQuery(`
    SELECT 
      event_object_schema,
      event_object_table,
      trigger_name,
      action_statement,
      action_timing,
      event_manipulation
    FROM information_schema.triggers
  `);
  console.log(JSON.stringify(triggers, null, 2));

  console.log("\n=== FUNCTION: public.handle_new_user DEFINITION ===");
  const func = await runQuery(`
    SELECT pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'handle_new_user'
  `);
  if (func && func[0]) {
    console.log(func[0].def);
  } else {
    console.log("handle_new_user not found");
  }

  await supabase.auth.signOut();
}

run();
