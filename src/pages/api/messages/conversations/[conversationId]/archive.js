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

      // Check if user is participant in this conversation
      const { data: participant, error: partError } = await supabaseAdmin
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (partError || !participant) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if already archived
      const { data: existingArchive, error: archiveError } = await supabaseAdmin
        .from('conversation_archives')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (existingArchive) {
        return res.status(409).json({ error: "Conversation already archived" });
      }

      // Archive conversation
      const { data: archive, error: insertError } = await supabaseAdmin
        .from('conversation_archives')
        .insert([{
          conversation_id: conversationId,
          user_id: user.id
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error archiving conversation:', insertError);
        return res.status(500).json({ error: "Failed to archive conversation" });
      }

      return res.status(201).json({ archive });
    } catch (error) {
      console.error('Archive conversation error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 