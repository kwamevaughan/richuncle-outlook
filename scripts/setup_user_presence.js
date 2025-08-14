const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupUserPresence() {
  try {
    console.log('Setting up user presence table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_user_presence_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating user presence table:', error);
      return;
    }
    
    console.log('✅ User presence table created successfully!');
    
    // Test the table by inserting a test record
    const { data: testUser } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    if (testUser) {
      const { error: insertError } = await supabase
        .from('user_presence')
        .upsert({
          user_id: testUser.id,
          status: 'online',
          last_seen: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error testing user presence table:', insertError);
      } else {
        console.log('✅ User presence table test successful!');
        
        // Clean up test record
        await supabase
          .from('user_presence')
          .delete()
          .eq('user_id', testUser.id);
      }
    }
    
  } catch (error) {
    console.error('Error setting up user presence:', error);
  }
}

// Run if called directly
if (require.main === module) {
  setupUserPresence().then(() => {
    console.log('Setup complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupUserPresence };