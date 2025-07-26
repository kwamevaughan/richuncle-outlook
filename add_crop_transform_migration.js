require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and service role key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCropTransformColumn() {
  try {
    console.log('Starting crop_transform migration...');

    // Add crop_transform column to users table
    console.log('Adding crop_transform column to users table...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS crop_transform JSONB;'
    });
    
    if (addColumnError) {
      console.error('Error adding crop_transform column:', addColumnError);
    } else {
      console.log('✓ Added crop_transform column to users table');
    }

    // Create an index for faster lookups (optional)
    console.log('Creating index for crop_transform...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_users_crop_transform ON users USING GIN (crop_transform);'
    });
    
    if (indexError) {
      console.error('Error creating index:', indexError);
    } else {
      console.log('✓ Created index for crop_transform');
    }

    console.log('Crop transform migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. The crop_transform column has been added to the users table');
    console.log('2. Existing users will have NULL values for crop_transform');
    console.log('3. New image repositioning will store transformation parameters');
    console.log('4. Original images will be preserved and transformations applied on-the-fly');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addCropTransformColumn(); 