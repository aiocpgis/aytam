import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hizrvkxubfiobjhrbmcn.supabase.co', 'sb_publishable_EbSPC5UDSZbUwt7_kZw0yg_BoczEwoM');

async function run() {
  const { error } = await supabase.from('orphans').update({ non_existent_column: "test" }).eq('id', 'c0fbb086-ec61-4191-b924-fdf695629c1d');
  console.log('Update error:', error);
}
run();
