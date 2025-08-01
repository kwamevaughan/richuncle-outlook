import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user from custom auth system
    const userCookie = req.cookies.user;
    let user = null;

    if (userCookie) {
      try {
        user = JSON.parse(decodeURIComponent(userCookie));
      } catch (e) {
        console.error('Error parsing user cookie:', e);
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { topic } = req.body;

    // Remove subscription from database
    const { error } = await supabaseAdmin
      .from('push_notification_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('topic', topic || 'messages');

    if (error) {
      console.error('Error removing subscription:', error);
      return res.status(500).json({ error: "Failed to remove subscription" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 