const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillUnitPrice() {
  // 1. Fetch all order_items where unit_price is null
  const { data: items, error } = await supabase
    .from('order_items')
    .select('id, price, unit_price')
    .is('unit_price', null);
  if (error) throw error;
  if (!items || items.length === 0) {
    console.log('No order_items to update.');
    return;
  }
  // 2. Update each item to set unit_price = price if price is a valid number
  for (const item of items) {
    if (item.price !== undefined && item.price !== null && !isNaN(Number(item.price))) {
      await supabase
        .from('order_items')
        .update({ unit_price: Number(item.price) })
        .eq('id', item.id);
      console.log(`Updated order_item ${item.id} with unit_price ${item.price}`);
    }
  }
  console.log('Backfill complete!');
}

backfillUnitPrice().catch(console.error); 