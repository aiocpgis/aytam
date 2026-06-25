import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.from('orphans').select('id, child_full_name, photo_path, photo_paths').limit(1);
  console.log('Orphans select:', data, error);
}
run();
