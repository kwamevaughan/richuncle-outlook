import supabaseAdmin from '@/lib/supabaseAdmin';

// Helper to get pagination parameters
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const from = page ? page * limit : 0;
  const to = from + size - 1;
  
  return { from, to };
};

// Get all notifications for the current user
export default async function handler(req, res) {
  // Get user ID from request headers (sent by client)
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - User ID required' });
  }

  try {
    if (req.method === 'GET') {
      const { page = 1, limit = 20 } = req.query;
      const { from, to } = getPagination(page - 1, parseInt(limit));
      
      // Get total count for pagination
      const { count, error: countError } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (countError) throw countError;
      
      // Get paginated notifications
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return res.status(200).json(notifications || []);
    } else if (req.method === 'POST') {
      // Mark all notifications as read
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred', 
      details: error.message 
    });
  }
}
