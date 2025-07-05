const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDatabase() {
  try {
    console.log('Starting database updates...');

    // Add cost_price to products table
    console.log('Adding cost_price column to products table...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00;'
    });
    
    if (productsError) {
      console.error('Error adding cost_price to products:', productsError);
    } else {
      console.log('✓ Added cost_price to products table');
    }

    // Add tax fields to products table
    console.log('Adding tax configuration fields to products table...');
    const { error: taxTypeError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT \'exclusive\';'
    });
    
    if (taxTypeError) {
      console.error('Error adding tax_type to products:', taxTypeError);
    } else {
      console.log('✓ Added tax_type to products table');
    }

    const { error: taxPercentageError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0.00;'
    });
    
    if (taxPercentageError) {
      console.error('Error adding tax_percentage to products:', taxPercentageError);
    } else {
      console.log('✓ Added tax_percentage to products table');
    }

    // Add cost_price to order_items table
    console.log('Adding cost_price column to order_items table...');
    const { error: orderItemsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00;'
    });
    
    if (orderItemsError) {
      console.error('Error adding cost_price to order_items:', orderItemsError);
    } else {
      console.log('✓ Added cost_price to order_items table');
    }

    // Add tax fields to order_items table
    console.log('Adding tax fields to order_items table...');
    const { error: orderItemsTaxTypeError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT \'exclusive\';'
    });
    
    if (orderItemsTaxTypeError) {
      console.error('Error adding tax_type to order_items:', orderItemsTaxTypeError);
    } else {
      console.log('✓ Added tax_type to order_items table');
    }

    const { error: orderItemsTaxPercentageError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0.00;'
    });
    
    if (orderItemsTaxPercentageError) {
      console.error('Error adding tax_percentage to order_items:', orderItemsTaxPercentageError);
    } else {
      console.log('✓ Added tax_percentage to order_items table');
    }

    const { error: orderItemsItemTaxError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_tax DECIMAL(10,2) DEFAULT 0.00;'
    });
    
    if (orderItemsItemTaxError) {
      console.error('Error adding item_tax to order_items:', orderItemsItemTaxError);
    } else {
      console.log('✓ Added item_tax to order_items table');
    }

    // Update existing products
    console.log('Updating existing products with default values...');
    const { error: updateProductsError } = await supabase
      .from('products')
      .update({ 
        cost_price: 0.00,
        tax_type: 'exclusive',
        tax_percentage: 0.00
      })
      .or('cost_price.is.null,tax_type.is.null,tax_percentage.is.null');
    
    if (updateProductsError) {
      console.error('Error updating products:', updateProductsError);
    } else {
      console.log('✓ Updated existing products');
    }

    // Update existing order_items
    console.log('Updating existing order_items with default values...');
    const { error: updateOrderItemsError } = await supabase
      .from('order_items')
      .update({ 
        cost_price: 0.00,
        tax_type: 'exclusive',
        tax_percentage: 0.00,
        item_tax: 0.00
      })
      .or('cost_price.is.null,tax_type.is.null,tax_percentage.is.null,item_tax.is.null');
    
    if (updateOrderItemsError) {
      console.error('Error updating order_items:', updateOrderItemsError);
    } else {
      console.log('✓ Updated existing order_items');
    }

    console.log('Database updates completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your existing products with their actual cost prices and tax configurations');
    console.log('2. Test the new tax calculation features');
    console.log('3. Verify that new orders are saving tax information correctly');
    console.log('4. Test the Today\'s Sales and Today\'s Profit features with tax calculations');

  } catch (error) {
    console.error('Database update failed:', error);
  }
}

updateDatabase(); 