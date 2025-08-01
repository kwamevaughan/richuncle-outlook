import supabaseAdmin from "@/lib/supabaseAdmin";
import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

    const { userId, title, body, data = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    // Get user's push notification subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_notification_subscriptions')
      .select('*')
      .eq('user_id', userId || user.id);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: "Failed to fetch subscriptions" });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: "No push notification subscriptions found" });
    }

    // Send push notification to all user subscriptions
    const results = [];
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.subscription_endpoint,
          keys: subscription.subscription_keys
        };

        const payload = JSON.stringify({
          title,
          body,
          data,
          tag: data.tag || 'default'
        });

        await webpush.sendNotification(pushSubscription, payload);
        results.push({ success: true, subscription: subscription.id });
      } catch (error) {
        console.error('Error sending push notification:', error);
        results.push({ success: false, subscription: subscription.id, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return res.status(200).json({
      success: true,
      message: `Sent ${successCount} notifications, ${failureCount} failed`,
      results
    });
  } catch (error) {
    console.error('Send notification API error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 