import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Update user presence
    const { user, status, timestamp } = req.body;

    if (!user?.id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      // Update or insert user presence
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: status || 'online',
          last_seen: timestamp || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating presence:', error);
        return res.status(500).json({ error: 'Failed to update presence' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in presence update:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Get online users
    try {
      // Consider users online if they were active in the last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data: presenceData, error } = await supabase
        .from('user_presence')
        .select(`
          user_id,
          status,
          last_seen,
          users (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .gte('last_seen', twoMinutesAgo);

      if (error) {
        console.error('Error fetching presence:', error);
        return res.status(500).json({ error: 'Failed to fetch presence' });
      }

      // Get all user presence data for last seen times
      const { data: allPresenceData, error: allPresenceError } = await supabase
        .from('user_presence')
        .select('user_id, last_seen');

      if (allPresenceError) {
        console.error('Error fetching all presence:', allPresenceError);
      }

      const onlineUsers = presenceData
        ?.filter(p => p.status === 'online' || p.status === 'away')
        ?.map(p => p.user_id) || [];

      const lastSeen = {};
      allPresenceData?.forEach(p => {
        lastSeen[p.user_id] = p.last_seen;
      });

      res.status(200).json({
        onlineUsers,
        lastSeen,
        presenceData: presenceData || []
      });
    } catch (error) {
      console.error('Error in presence fetch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}