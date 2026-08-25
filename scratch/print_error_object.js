import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpmzigojfwqiffleligg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXppZ29qZndxaWZmbGVsaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzg1ODEsImV4cCI6MjA5NjY1NDU4MX0.WPrgf0AjwV9D2Bbs45CcZa8eHoxaugVvNAV1zSrNBXc';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user33@gmail.com',
    password: 'Password123!' // Using a dummy password to see if it even gets to credential validation
  });

  console.log("Error object:", JSON.stringify(error, null, 2));
}

run();
