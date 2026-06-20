import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function clearData() {
  console.log('⚡ Connecting to Supabase API...');
  
  // 1. Delete sessions
  console.log('⏳ Deleting all sessions...');
  const { data: sData, error: sError } = await supabase
    .from('sessions')
    .delete()
    .neq('id', '');
    
  if (sError) {
    console.error('❌ Error deleting sessions:', sError);
  } else {
    console.log('✅ Successfully deleted all sessions!');
  }

  // 2. Delete virtual sections
  console.log('⏳ Deleting all virtual sections...');
  const { data: vData, error: vError } = await supabase
    .from('virtual_sections')
    .delete()
    .neq('id', '');
    
  if (vError) {
    console.error('❌ Error deleting virtual sections:', vError);
  } else {
    console.log('✅ Successfully deleted all virtual sections!');
  }

  console.log('🎉 Done!');
}

clearData();
