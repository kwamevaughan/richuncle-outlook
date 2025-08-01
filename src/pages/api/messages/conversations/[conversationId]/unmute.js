import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method === "POST") {
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

      // Remove from mutes
      const { error: deleteError } = await supabaseAdmin
        .from('conversation_mutes')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error unmuting conversation:', deleteError);
        return res.status(500).json({ error: "Failed to unmute conversation" });
      }

      return res.status(200).json({ message: "Conversation unmuted" });
    } catch (error) {
      console.error('Unmute conversation error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 