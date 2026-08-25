import supabase from './src/utils/supabase.js';

async function checkColumns() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error("Error fetching submissions:", error);
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
