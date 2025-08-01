import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Get user from request body
      const { user, title, type = 'direct', participant_ids } = req.body;

      if (!user || !user.id) {
        return res.status(401).json({ error: "Unauthorized - User information required" });
      }



      // If this is a GET request (fetching conversations)
      if (!title && !participant_ids) {
        // Get conversations where user is a participant
        const { data: conversations, error } = await supabaseAdmin
          .from('conversations')
          .select(`
            *,
            conversation_participants!inner(
              user_id,
              role,
              last_read_at
            ),
            messages(
              id,
              content,
              sender_id,
              created_at
            )
          `)
          .eq('conversation_participants.user_id', user.id)
          .eq('conversation_participants.is_active', true)
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error("Error fetching conversations:", error);
          return res.status(500).json({ error: "Failed to fetch conversations" });
        }

        // Process conversations to include participant info and last message
        const processedConversations = conversations.map(conv => {
          const participants = conv.conversation_participants || [];
          const messages = conv.messages || [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          
          return {
            id: conv.id,
            title: conv.title,
            type: conv.type,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            participants: participants.length,
            last_message: lastMessage,
            unread_count: participants.find(p => p.user_id === user.id)?.last_read_at 
              ? messages.filter(m => new Date(m.created_at) > new Date(participants.find(p => p.user_id === user.id).last_read_at)).length
              : messages.length
          };
        });

        return res.status(200).json({ conversations: processedConversations });
      }

      // If this is a POST request (creating conversation)
      if (!participant_ids || participant_ids.length === 0) {
        return res.status(400).json({ error: "At least one participant is required" });
      }

      // Add current user to participants if not already included
      const allParticipantIds = [...new Set([user.id, ...participant_ids])];

      // Create conversation
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert([{
          title: title || `Conversation with ${allParticipantIds.length} participants`,
          type,
          created_by: user.id
        }])
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        return res.status(500).json({ error: "Failed to create conversation" });
      }

      // Add participants
      const participants = allParticipantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        role: userId === user.id ? 'admin' : 'participant'
      }));

      const { error: partError } = await supabaseAdmin
        .from('conversation_participants')
        .insert(participants);

      if (partError) {
        console.error("Error adding participants:", partError);
        return res.status(500).json({ error: "Failed to add participants" });
      }

      return res.status(201).json({ conversation });
    } catch (error) {
      console.error("Conversations API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 