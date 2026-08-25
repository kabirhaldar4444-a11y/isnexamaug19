import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwlvrohowziiejnuykij.supabase.co';
const supabaseAnonKey = 'sb_publishable_EpvDw8A3_2dD_iwCtKyIVA_vaRuC9c7';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .limit(1);
  
  if (error) {
    if (error.code === 'PGRST204') {
        console.log("PostgREST Error PGRST204: Column not found.");
        console.log(error.message);
    } else {
        console.error("Error fetching submissions:", error);
    }
  } else {
    console.log("Submissions data (first row):", data);
    if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No submissions found to check columns.");
    }
  }
}

checkColumns();
