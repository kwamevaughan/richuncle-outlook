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

      // Check if already muted
      const { data: existingMute, error: muteError } = await supabaseAdmin
        .from('conversation_mutes')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (existingMute) {
        return res.status(409).json({ error: "Conversation already muted" });
      }

      // Mute conversation
      const { data: mute, error: insertError } = await supabaseAdmin
        .from('conversation_mutes')
        .insert([{
          conversation_id: conversationId,
          user_id: user.id
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error muting conversation:', insertError);
        return res.status(500).json({ error: "Failed to mute conversation" });
      }

      return res.status(201).json({ mute });
    } catch (error) {
      console.error('Mute conversation error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 