#!/usr/bin/env node

/**
 * Setup script for conversation_typing table
 * 
 * This script provides the SQL commands needed to create the conversation_typing table
 * for the typing indicator functionality.
 * 
 * To use this:
 * 1. Go to your Supabase dashboard
 * 2. Navigate to the SQL Editor
 * 3. Copy and paste the SQL commands below
 * 4. Run the commands
 */

const sqlCommands = `
-- Add conversation_typing table for real-time typing indicators
CREATE TABLE IF NOT EXISTS conversation_typing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_typing_conversation_id ON conversation_typing(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_typing_user_id ON conversation_typing(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_typing_updated_at ON conversation_typing(updated_at);

-- Add RLS policies
ALTER TABLE conversation_typing ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see typing status for conversations they participate in
CREATE POLICY "Users can view typing status for their conversations" ON conversation_typing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_typing.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

-- Policy: Users can only insert their own typing status
CREATE POLICY "Users can insert their own typing status" ON conversation_typing
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_typing.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

-- Policy: Users can only update their own typing status
CREATE POLICY "Users can update their own typing status" ON conversation_typing
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- Policy: Users can only delete their own typing status
CREATE POLICY "Users can delete their own typing status" ON conversation_typing
    FOR DELETE USING (
        user_id = auth.uid()
    );
`;

console.log('📝 Conversation Typing Table Setup');
console.log('==================================');
console.log('');
console.log('To enable typing indicators, you need to create the conversation_typing table.');
console.log('');
console.log('📋 Instructions:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to the SQL Editor');
console.log('3. Copy and paste the SQL commands below');
console.log('4. Run the commands');
console.log('');
console.log('🔧 SQL Commands:');
console.log('```sql');
console.log(sqlCommands);
console.log('```');
console.log('');
console.log('✅ After running these commands, the typing indicator will work properly!');
console.log('');
console.log('💡 Note: The typing indicator will gracefully handle missing tables until you create them.'); 