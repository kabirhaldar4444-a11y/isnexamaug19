import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpmzigojfwqiffleligg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXppZ29qZndxaWZmbGVsaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzg1ODEsImV4cCI6MjA5NjY1NDU4MX0.WPrgf0AjwV9D2Bbs45CcZa8eHoxaugVvNAV1zSrNBXc';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

async function runTest() {
  console.log("=== STEP 1: Log in as Admin ===");
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signInWithPassword({
    email: 'info@isuccessnode.com',
    password: 'qwerty@123'
  });

  if (adminAuthError) {
    console.error("Admin sign in failed:", adminAuthError.message);
    return;
  }
  console.log("Admin sign in successful. UID:", adminAuth.user.id);

  console.log("\n=== STEP 2: Fetch all profiles as Admin ===");
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error("Admin fetch profiles failed:", profilesError.message);
  } else {
    console.log("Found profiles:", profiles.length);
    profiles.forEach(p => {
      console.log(`- ${p.email} [${p.role}]: ${p.full_name}`);
    });
  }

  // Create a random test candidate
  const testEmail = `test_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  const testName = 'Test Candidate';

  console.log(`\n=== STEP 3: Create candidate: ${testEmail} ===`);
  const { data: newUserId, error: createError } = await supabase.rpc('admin_create_candidate', {
    candidate_email: testEmail,
    candidate_password: testPassword,
    candidate_name: testName
  });

  if (createError) {
    console.error("Create candidate failed:", createError.message);
    return;
  }
  console.log("Candidate created successfully. ID:", newUserId);

  // Sign out admin
  await supabase.auth.signOut();

  console.log(`\n=== STEP 4: Log in as new candidate: ${testEmail} ===`);
  const { data: candidateAuth, error: candidateAuthError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (candidateAuthError) {
    console.error("Candidate sign in failed:", candidateAuthError.message);
    return;
  }
  console.log("Candidate sign in successful. UID:", candidateAuth.user.id);

  console.log("\n=== STEP 5: Fetch profile as candidate ===");
  const { data: candProfile, error: candProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', candidateAuth.user.id)
    .single();

  if (candProfileError) {
    console.error("Candidate fetch profile failed:", candProfileError.message);
    console.error("Error details:", JSON.stringify(candProfileError, null, 2));
  } else {
    console.log("Candidate profile fetched successfully:", candProfile.email, candProfile.role);
  }

  // Clean up by signing out
  await supabase.auth.signOut();
}

runTest();
