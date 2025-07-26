require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCropTransformColumn() {
  try {
    console.log('Starting crop_transform migration...');

    // Add crop_transform column to users table using raw SQL
    console.log('Adding crop_transform column to users table...');
    const { error: addColumnError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS crop_transform JSONB;'
    });
    
    if (addColumnError) {
      console.error('Error adding crop_transform column:', addColumnError);
      // Try alternative approach using direct SQL
      console.log('Trying alternative approach...');
      const { error: directError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (directError) {
        console.error('Cannot access users table:', directError);
        return;
      }
      
      console.log('Users table is accessible. The crop_transform column may already exist or need to be added manually.');
    } else {
      console.log('✓ Added crop_transform column to users table');
    }

    // Try to create index
    console.log('Creating index for crop_transform...');
    const { error: indexError } = await supabase.rpc('sql', {
      query: 'CREATE INDEX IF NOT EXISTS idx_users_crop_transform ON users USING GIN (crop_transform);'
    });
    
    if (indexError) {
      console.error('Error creating index:', indexError);
      console.log('Index creation failed, but this is not critical for functionality.');
    } else {
      console.log('✓ Created index for crop_transform');
    }

    // Test if we can access the column
    console.log('Testing column access...');
    const { data, error: testError } = await supabase
      .from('users')
      .select('id, crop_transform')
      .limit(1);
    
    if (testError) {
      console.error('Error testing column access:', testError);
      console.log('The crop_transform column may need to be added manually in the Supabase dashboard.');
    } else {
      console.log('✓ Column access test successful');
    }

    console.log('\nCrop transform migration completed!');
    console.log('\nNext steps:');
    console.log('1. If the column was not added automatically, add it manually in Supabase dashboard:');
    console.log('   - Go to your Supabase project dashboard');
    console.log('   - Navigate to Table Editor > users table');
    console.log('   - Add a new column: crop_transform (type: jsonb)');
    console.log('2. New image repositioning will store transformation parameters');
    console.log('3. Original images will be preserved and transformations applied on-the-fly');

  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nManual steps required:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Table Editor > users table');
    console.log('3. Add a new column: crop_transform (type: jsonb)');
    console.log('4. The application will work once the column is added');
  }
}

// Run the migration
addCropTransformColumn(); 