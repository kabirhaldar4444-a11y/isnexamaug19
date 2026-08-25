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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking exams...");
  const { data: exams, error: examsErr } = await supabase.from('exams').select('*');
  if (examsErr) {
    console.error('Error fetching exams:', examsErr);
  } else {
    console.log('Exams in DB:', exams);
  }

  console.log("Checking submissions...");
  const { data: submissions, error: submissionsErr } = await supabase.from('submissions').select('*');
  if (submissionsErr) {
    console.error('Error fetching submissions:', submissionsErr);
  } else {
    console.log('Submissions in DB:', submissions);
  }

  const daaExam = exams?.find(e => e.title === 'daa');
  if (daaExam) {
    console.log(`Found exam 'daa' with ID ${daaExam.id}. Attempting to delete it...`);
    const { data, error: deleteErr } = await supabase.from('exams').delete().eq('id', daaExam.id);
    if (deleteErr) {
      console.error('FAILED TO DELETE EXAM. Error details:', deleteErr);
    } else {
      console.log('SUCCESSFULLY DELETED EXAM:', data);
    }
  } else {
    console.log("No exam named 'daa' found.");
  }
  
  process.exit(0);
}

check().catch(err => {
  console.error("Unhandle exception:", err);
  process.exit(1);
});
