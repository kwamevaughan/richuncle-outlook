import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method === "POST") {
    try {
      // Get user from request body
      const { user, content, after, message_type = 'text', metadata = {} } = req.body;

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

      // If content is provided, this is a message send request
      if (content) {
        if (!content.trim()) {
          return res.status(400).json({ error: "Message content is required" });
        }

        // Create message
        const { data: message, error: msgError } = await supabaseAdmin
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: user.id,
            content: content.trim(),
            message_type,
            metadata
          }])
          .select(`
            *,
            sender:users!messages_sender_id_fkey(
              id,
              full_name,
              avatar_url,
              role
            )
          `)
          .single();

        if (msgError) {
          console.error("Error creating message:", msgError);
          return res.status(500).json({ error: "Failed to send message" });
        }

        // Update conversation's updated_at timestamp
        await supabaseAdmin
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return res.status(201).json({ message });
      }

      // If no content, this is a fetch request
      // Get conversation details with participants
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          conversation_participants(
            user_id,
            role,
            joined_at,
            last_read_at
          )
        `)
        .eq('id', conversationId)
        .eq('is_active', true)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Get messages for this conversation
      let query = supabaseAdmin
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url,
            role
          ),
          message_reactions(
            id,
            reaction_name,
            user_id,
            created_at,
            users!message_reactions_user_id_fkey(
              id,
              full_name
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false);

      // If after parameter is provided, only get messages after that ID
      if (after) {
        query = query.gt('id', after);
      }

      const { data: messages, error: msgError } = await query.order('created_at', { ascending: true });

      if (msgError) {
        console.error("Error fetching messages:", msgError);
        return res.status(500).json({ error: "Failed to fetch messages" });
      }

      // Update last read timestamp for current user
      await supabaseAdmin
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return res.status(200).json({
        conversation,
        messages,
        participants: conversation.conversation_participants
      });
    } catch (error) {
      console.error("Conversation API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 