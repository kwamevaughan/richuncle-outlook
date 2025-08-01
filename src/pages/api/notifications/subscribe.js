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

    const { subscription, topic } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }

    // Store subscription in database
    const { data, error } = await supabaseAdmin
      .from('push_notification_subscriptions')
      .upsert([{
        user_id: user.id,
        subscription_endpoint: subscription.endpoint,
        subscription_keys: subscription.keys,
        topic: topic || 'messages'
      }], {
        onConflict: 'user_id,topic'
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing subscription:', error);
      return res.status(500).json({ error: "Failed to store subscription" });
    }

    return res.status(200).json({ success: true, subscription: data });
  } catch (error) {
    console.error('Subscribe API error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 