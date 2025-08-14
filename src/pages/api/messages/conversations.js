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
        // Get conversations where user is a participant with all participants
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

        // Early return if no conversations
        if (!conversations || conversations.length === 0) {
          return res.status(200).json({ conversations: [] });
        }

        // Get all conversation IDs
        const conversationIds = conversations.map(conv => conv.id);

        // Fetch all participants for all conversations in a single query
        const { data: allParticipants, error: participantsError } = await supabaseAdmin
          .from('conversation_participants')
          .select('conversation_id, user_id, role, last_read_at')
          .in('conversation_id', conversationIds)
          .eq('is_active', true);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
          return res.status(500).json({ error: "Failed to fetch participants" });
        }

        // Group participants by conversation_id
        const participantsByConversation = {};
        allParticipants.forEach(participant => {
          if (!participantsByConversation[participant.conversation_id]) {
            participantsByConversation[participant.conversation_id] = [];
          }
          participantsByConversation[participant.conversation_id].push(participant);
        });

        // Merge participants with conversations
        const conversationsWithAllParticipants = conversations.map(conv => ({
          ...conv,
          conversation_participants: participantsByConversation[conv.id] || []
        }));

        // Process conversations to include participant info and last message
        const processedConversations = conversationsWithAllParticipants.map(conv => {
          const participants = conv.conversation_participants || [];
          const messages = conv.messages || [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          
          // For direct conversations, find the other participant
          let otherParticipantId = null;
          if (conv.type === 'direct' && participants.length >= 1) {
            // Find any participant that is not the current user
            const otherParticipant = participants.find(p => p.user_id !== user.id);
            if (otherParticipant) {
              otherParticipantId = otherParticipant.user_id;
            }
          }

          const currentParticipant = participants.find(p => p.user_id === user.id);

          return {
            id: conv.id,
            title: conv.title,
            type: conv.type,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            participants: participants.length,
            other_participant_id: otherParticipantId,
            last_message: lastMessage,
            unread_count: currentParticipant?.last_read_at 
              ? messages.filter(m => new Date(m.created_at) > new Date(currentParticipant.last_read_at)).length
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

      // Check for existing conversation with the same participants
      // For direct messages with one participant, do a simple check
      if (type === 'direct' && participant_ids.length === 1) {
        const otherUserId = participant_ids[0];
        
        // Get all conversations where current user is a participant
        const { data: userConversations, error: userConvError } = await supabaseAdmin
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!userConvError && userConversations) {
          const userConvIds = userConversations.map(c => c.conversation_id);
          
          // Get all conversations where other user is a participant
          const { data: otherUserConversations, error: otherConvError } = await supabaseAdmin
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', otherUserId)
            .eq('is_active', true);

          if (!otherConvError && otherUserConversations) {
            const otherConvIds = otherUserConversations.map(c => c.conversation_id);
            
            // Find intersection (conversations where both users are participants)
            const commonConversationIds = userConvIds.filter(id => otherConvIds.includes(id));
            
            if (commonConversationIds.length > 0) {
              // Check if any of these are direct conversations
              const { data: existingDirectConversation, error: directCheckError } = await supabaseAdmin
                .from('conversations')
                .select('id, title, type')
                .eq('type', 'direct')
                .eq('is_active', true)
                .in('id', commonConversationIds)
                .single();

              if (!directCheckError && existingDirectConversation) {
                console.log('Found existing direct conversation:', existingDirectConversation.id);
                return res.status(200).json({ 
                  conversation: existingDirectConversation,
                  message: "Existing conversation found",
                  isExisting: true
                });
              }
            }
          }
        }
      }

      // For other cases, get all conversations where the current user is a participant
      const { data: existingConversations, error: checkError } = await supabaseAdmin
        .from('conversations')
        .select(`
          id,
          title,
          type,
          conversation_participants(user_id)
        `)
        .eq('conversation_participants.user_id', user.id)
        .eq('conversation_participants.is_active', true)
        .eq('is_active', true);

      if (checkError) {
        console.error("Error checking existing conversations:", checkError);
        return res.status(500).json({ error: "Failed to check existing conversations" });
      }

      // Check if any existing conversation has the exact same participants
      let existingConversation = null;
      console.log('Checking for duplicates with participants:', allParticipantIds);
      console.log('Existing conversations found:', existingConversations?.length || 0);
      
      for (const conv of existingConversations || []) {
        // Get all participants for this conversation
        const { data: participants, error: partError } = await supabaseAdmin
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .eq('is_active', true);
        
        if (partError) {
          console.error('Error fetching participants for conversation:', conv.id, partError);
          continue;
        }
        
        const convParticipantIds = participants.map(p => p.user_id).sort();
        const requestedParticipantIds = allParticipantIds.sort();
        
        console.log(`Checking conversation ${conv.id}:`, {
          convParticipantIds,
          requestedParticipantIds,
          match: convParticipantIds.length === requestedParticipantIds.length &&
                  convParticipantIds.every((id, index) => id === requestedParticipantIds[index])
        });
        
        if (convParticipantIds.length === requestedParticipantIds.length &&
            convParticipantIds.every((id, index) => id === requestedParticipantIds[index])) {
          existingConversation = conv;
          console.log('Found existing conversation:', conv.id);
          break;
        }
      }

      // If existing conversation found, return it instead of creating new one
      if (existingConversation) {
        return res.status(200).json({ 
          conversation: existingConversation,
          message: "Existing conversation found",
          isExisting: true
        });
      }



      // Create new conversation only if no existing one found
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