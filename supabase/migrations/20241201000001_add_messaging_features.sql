-- Add message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_name)
);

-- Add conversation_archives table
CREATE TABLE IF NOT EXISTS conversation_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Add conversation_mutes table
CREATE TABLE IF NOT EXISTS conversation_mutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    muted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Add push_notification_subscriptions table
CREATE TABLE IF NOT EXISTS push_notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_endpoint TEXT NOT NULL,
    subscription_keys JSONB NOT NULL,
    topic VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_archives_conversation_id ON conversation_archives(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_archives_user_id ON conversation_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_mutes_conversation_id ON conversation_mutes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_mutes_user_id ON conversation_mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_subscriptions_user_id ON push_notification_subscriptions(user_id);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Message reactions policies
CREATE POLICY "Users can view reactions on messages they can see" ON message_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.is_active = true
        )
    );

CREATE POLICY "Users can add reactions to messages they can see" ON message_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        message_id IN (
            SELECT m.id FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.is_active = true
        )
    );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Conversation archives policies
CREATE POLICY "Users can view their own archives" ON conversation_archives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can archive conversations they participate in" ON conversation_archives
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can unarchive their own archives" ON conversation_archives
    FOR DELETE USING (auth.uid() = user_id);

-- Conversation mutes policies
CREATE POLICY "Users can view their own mutes" ON conversation_mutes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mute conversations they participate in" ON conversation_mutes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can unmute their own mutes" ON conversation_mutes
    FOR DELETE USING (auth.uid() = user_id);

-- Push notification subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON push_notification_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" ON push_notification_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_notification_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_push_notification_subscriptions_updated_at BEFORE UPDATE ON push_notification_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_push_notification_subscriptions_updated_at(); 