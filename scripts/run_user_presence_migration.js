    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();

    const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
    );

    async function createUserPresenceTable() {
    try {
        console.log('Creating user_presence table...');
        
        // Create the table directly with SQL
        const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
            -- Create user_presence table for tracking online/offline status
            CREATE TABLE IF NOT EXISTS user_presence (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
            last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(user_id)
            );

            -- Create indexes for faster queries
            CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
            CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);
        `
        });
        
        if (error) {
        console.error('Error creating table:', error);
        
        // Try alternative approach - direct SQL execution
        const { error: directError } = await supabase
            .from('user_presence')
            .select('id')
            .limit(1);
        
        if (directError && directError.code === '42P01') {
            // Table doesn't exist, let's create it manually
            console.log('Table does not exist. Please run this SQL in your Supabase SQL editor:');
            console.log(`
    -- Create user_presence table for tracking online/offline status
    CREATE TABLE IF NOT EXISTS user_presence (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
    );

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
    CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

    -- Grant permissions
    GRANT ALL ON user_presence TO authenticated;
    GRANT ALL ON user_presence TO service_role;
            `);
            return;
        }
        }
        
        console.log('✅ User presence table created successfully!');
        
    } catch (error) {
        console.error('Error:', error);
        console.log('Please run this SQL manually in your Supabase SQL editor:');
        console.log(`
    -- Create user_presence table for tracking online/offline status
    CREATE TABLE IF NOT EXISTS user_presence (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
    );

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
    CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

    -- Grant permissions
    GRANT ALL ON user_presence TO authenticated;
    GRANT ALL ON user_presence TO service_role;
        `);
    }
    }

    createUserPresenceTable();