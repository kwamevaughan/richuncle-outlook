import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
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

      const { message_id, reaction_name } = req.body;

      if (!message_id || !reaction_name) {
        return res.status(400).json({ error: "Message ID and reaction name are required" });
      }

      // Check if user can access this message
      const { data: message, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('conversation_id')
        .eq('id', message_id)
        .single();

      if (msgError || !message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if user is participant in this conversation
      const { data: participant, error: partError } = await supabaseAdmin
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', message.conversation_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (partError || !participant) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if reaction already exists
      const { data: existingReaction, error: existingError } = await supabaseAdmin
        .from('message_reactions')
        .select('*')
        .eq('message_id', message_id)
        .eq('user_id', user.id)
        .eq('reaction_name', reaction_name)
        .single();

      if (existingReaction) {
        // Remove existing reaction (toggle off)
        const { error: deleteError } = await supabaseAdmin
          .from('message_reactions')
          .delete()
          .eq('message_id', message_id)
          .eq('user_id', user.id)
          .eq('reaction_name', reaction_name);

        if (deleteError) {
          console.error('Error removing reaction:', deleteError);
          return res.status(500).json({ error: "Failed to remove reaction" });
        }

        return res.status(200).json({ action: 'removed' });
      } else {
        // Add new reaction
        const { data: reaction, error: insertError } = await supabaseAdmin
          .from('message_reactions')
          .insert([{
            message_id,
            user_id: user.id,
            reaction_name
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error adding reaction:', insertError);
          return res.status(500).json({ error: "Failed to add reaction" });
        }

        return res.status(201).json({ action: 'added', reaction });
      }
    } catch (error) {
      console.error('Reactions API error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 