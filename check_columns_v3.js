import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwlvrohowziiejnuykij.supabase.co';
const supabaseAnonKey = 'sb_publishable_EpvDw8A3_2dD_iwCtKyIVA_vaRuC9c7';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  // Use a query to check the columns directly via a select from a hypothetical RPC or just trying to select the columns
  const { data, error } = await supabase
    .from('submissions')
    .select('id, user_id, exam_id, score, total_questions, answers, is_released, admin_score_override')
    .limit(1);
  
  if (error) {
    console.log("Error selecting columns:", error.message);
  } else {
    console.log("Columns are present.");
  }
}

checkColumns();
