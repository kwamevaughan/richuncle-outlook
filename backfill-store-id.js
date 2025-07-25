const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillStoreId() {
  // 1. Fetch all registers and build a map: register_id -> store_id
  const { data: registers, error: regError } = await supabase
    .from('registers')
    .select('id, store_id');
  if (regError) throw regError;
  const regMap = {};
  registers.forEach(r => { regMap[r.id] = r.store_id; });

  // 2. Fetch all orders missing store_id
  const { data: orders, error: ordError } = await supabase
    .from('orders')
    .select('id, register_id, store_id')
    .is('store_id', null);
  if (ordError) throw ordError;

  // 3. For each order, update with the correct store_id
  for (const order of orders) {
    const storeId = regMap[order.register_id];
    if (storeId) {
      await supabase
        .from('orders')
        .update({ store_id: storeId })
        .eq('id', order.id);
      console.log(`Updated order ${order.id} with store_id ${storeId}`);
    }
  }
  console.log('Backfill complete!');
}

backfillStoreId().catch(console.error); 