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

async function diagnose() {
  console.log("=== Log in as Admin to obtain access token ===");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'info@isuccessnode.com',
    password: 'qwerty@123'
  });
  
  if (authError) {
    console.error("Sign in failed:", authError.message);
    return;
  }
  console.log("Sign in successful!");

  console.log("\n=== Checking Active Triggers ===");
  const triggers = await runQuery(`
    SELECT 
      event_object_schema as schema,
      event_object_table as table,
      trigger_name as name,
      action_statement as action,
      action_timing as timing
    FROM information_schema.triggers
    ORDER BY event_object_table
  `);
  console.log("Triggers:", JSON.stringify(triggers, null, 2));

  console.log("\n=== Checking Auth Hooks ===");
  // Check if auth.hooks table exists and query it
  const hooksTableExists = await runQuery(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'hooks'
    )
  `);
  console.log("auth.hooks exists:", JSON.stringify(hooksTableExists, null, 2));

  if (hooksTableExists && hooksTableExists[0]?.exists) {
    const hooks = await runQuery("SELECT * FROM auth.hooks");
    console.log("Auth Hooks:", JSON.stringify(hooks, null, 2));
  }

  console.log("\n=== Checking All RLS Policies ===");
  const policies = await runQuery(`
    SELECT 
      schemaname as schema,
      tablename as table,
      policyname as name,
      permissive,
      roles,
      cmd as command,
      qual as using_expression,
      with_check as check_expression
    FROM pg_policies
    WHERE schemaname = 'public'
  `);
  console.log("Policies:", JSON.stringify(policies, null, 2));

  console.log("\n=== Checking pg_proc for hook functions ===");
  const functions = await runQuery(`
    SELECT 
      n.nspname as schema,
      p.proname as name,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname LIKE '%hook%' OR p.proname LIKE '%jwt%' OR p.proname LIKE '%role%'
  `);
  if (functions) {
    functions.forEach(f => {
      console.log(`\nFunction: ${f.schema}.${f.name}`);
      console.log("----------------------------------------");
      console.log(f.definition);
      console.log("----------------------------------------");
    });
  }

  await supabase.auth.signOut();
}

diagnose();
