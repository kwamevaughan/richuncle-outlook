import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method === "POST") {
    try {
      // Get user from request body
      const { user } = req.body;

      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized - User information required" });
      }

      // Remove from archives
      const { error: deleteError } = await supabaseAdmin
        .from('conversation_archives')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error unarchiving conversation:', deleteError);
        return res.status(500).json({ error: "Failed to unarchive conversation" });
      }

      return res.status(200).json({ message: "Conversation unarchived" });
    } catch (error) {
      console.error('Unarchive conversation error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 