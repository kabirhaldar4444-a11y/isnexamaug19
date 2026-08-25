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
  console.log("Logging in as Admin to query...");
  await supabase.auth.signInWithPassword({
    email: 'info@isuccessnode.com',
    password: 'qwerty@123'
  });

  console.log("=== Patching user33@gmail.com's nullable string fields ===");
  const patchRes = await runQuery(`
    WITH updated_rows AS (
      UPDATE auth.users
      SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        email_change_token_current = COALESCE(email_change_token_current, '')
      WHERE email = 'user33@gmail.com'
      RETURNING id
    )
    SELECT * FROM updated_rows
  `);
  console.log("Patch results:", JSON.stringify(patchRes, null, 2));

  await supabase.auth.signOut();

  console.log("\n=== Testing candidate login for user33@gmail.com ===");
  const { data: signinRes, error: signinError } = await supabase.auth.signInWithPassword({
    email: 'user33@gmail.com',
    password: 'wrong_password_here'
  });

  if (signinError) {
    console.log("Login returned error name:", signinError.name);
    console.log("Login returned error message:", signinError.message);
    console.log("Login returned error status:", signinError.status);
  } else {
    console.log("Login succeeded (unexpected since we used wrong password):", signinRes);
  }
}

run();
