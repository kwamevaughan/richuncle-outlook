const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testPresenceSetup() {
  console.log('🔍 Testing presence setup...\n');
  
  try {
    // Test 1: Check if user_presence table exists
    console.log('1. Checking if user_presence table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_presence')
      .select('id')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('❌ user_presence table does not exist!');
        console.log('Please run the SQL from user_presence_table.sql in your Supabase dashboard.\n');
        return;
      } else {
        console.log('❌ Error checking table:', tableError.message);
        return;
      }
    }
    
    console.log('✅ user_presence table exists\n');
    
    // Test 2: Check if we can fetch users
    console.log('2. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log(`✅ Found ${users.length} users`);
    users.forEach(user => {
      console.log(`   - ${user.full_name} (${user.id.substring(0, 8)}...)`);
    });
    console.log('');
    
    // Test 3: Test presence API endpoints
    console.log('3. Testing presence API...');
    
    if (users.length > 0) {
      const testUser = users[0];
      
      // Test POST (update presence)
      console.log('   Testing POST /api/messages/presence...');
      const postResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL_DEV || 'http://localhost:3000'}/api/messages/presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: testUser,
          status: 'online',
          timestamp: new Date().toISOString()
        }),
      });
      
      if (postResponse.ok) {
        console.log('   ✅ POST request successful');
      } else {
        const errorText = await postResponse.text();
        console.log('   ❌ POST request failed:', errorText);
      }
      
      // Test GET (fetch presence)
      console.log('   Testing GET /api/messages/presence...');
      const getResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL_DEV || 'http://localhost:3000'}/api/messages/presence`);
      
      if (getResponse.ok) {
        const presenceData = await getResponse.json();
        console.log('   ✅ GET request successful');
        console.log(`   📊 Online users: ${presenceData.onlineUsers?.length || 0}`);
        console.log(`   📊 Last seen records: ${Object.keys(presenceData.lastSeen || {}).length}`);
      } else {
        const errorText = await getResponse.text();
        console.log('   ❌ GET request failed:', errorText);
      }
    }
    
    console.log('\n🎉 Presence setup test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPresenceSetup();