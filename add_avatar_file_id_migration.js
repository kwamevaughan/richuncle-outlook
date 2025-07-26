const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and service role key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAvatarFileIdColumn() {
  try {
    console.log('Starting avatar_file_id migration...');

    // Add avatar_file_id column to users table
    console.log('Adding avatar_file_id column to users table...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file_id VARCHAR(255);'
    });
    
    if (addColumnError) {
      console.error('Error adding avatar_file_id column:', addColumnError);
    } else {
      console.log('✓ Added avatar_file_id column to users table');
    }

    // Create an index for faster lookups (optional)
    console.log('Creating index for avatar_file_id...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_users_avatar_file_id ON users(avatar_file_id);'
    });
    
    if (indexError) {
      console.error('Error creating index:', indexError);
    } else {
      console.log('✓ Created index for avatar_file_id');
    }

    console.log('Avatar file ID migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. The avatar_file_id column has been added to the users table');
    console.log('2. Existing users will have NULL values for avatar_file_id');
    console.log('3. New profile picture uploads will now track the ImageKit file ID');
    console.log('4. Previous images will be replaced when new ones are uploaded');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addAvatarFileIdColumn(); 