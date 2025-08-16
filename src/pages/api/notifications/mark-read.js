import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - User ID required' });
  }

  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: 'Notification IDs array is required' });
    }

    // Mark multiple notifications as read
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds)
      .eq('user_id', userId);

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: `${notificationIds.length} notifications marked as read` 
    });
  } catch (error) {
    console.error('Mark notifications as read API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred', 
      details: error.message 
    });
  }
} 