import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method === "POST") {
    try {
      // Get user from request body
      const { user, isTyping, check } = req.body;

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

      // If this is a check request, return current typing users
      if (check) {
        try {
          // Get all users currently typing in this conversation
          const { data: typingUsers, error: typingError } = await supabaseAdmin
            .from('conversation_typing')
            .select(`
              user_id,
              users!conversation_typing_user_id_fkey(
                id,
                full_name
              )
            `)
            .eq('conversation_id', conversationId)
            .gt('updated_at', new Date(Date.now() - 10000).toISOString()); // Only users typing in last 10 seconds

          if (typingError) {
            // If table doesn't exist, return empty array
            if (typingError.code === 'PGRST200') {
              console.log('conversation_typing table does not exist yet');
              return res.status(200).json({ typingUsers: [] });
            }
            console.error('Error fetching typing users:', typingError);
            return res.status(500).json({ error: "Failed to fetch typing users" });
          }

          // Filter out current user and format response
          const otherTypingUsers = (typingUsers || [])
            .filter(typing => typing.user_id !== user.id)
            .map(typing => ({
              id: typing.users.id,
              name: typing.users.full_name
            }));

          return res.status(200).json({ typingUsers: otherTypingUsers });
        } catch (error) {
          console.error('Error in typing check:', error);
          return res.status(200).json({ typingUsers: [] });
        }
      }

      // Update or insert typing status
      if (isTyping) {
        try {
          const { error: upsertError } = await supabaseAdmin
            .from('conversation_typing')
            .upsert([{
              conversation_id: conversationId,
              user_id: user.id,
              updated_at: new Date().toISOString()
            }], {
              onConflict: 'conversation_id,user_id'
            });

          if (upsertError) {
            // If table doesn't exist, just return success (typing won't work but won't break)
            if (upsertError.code === 'PGRST200') {
              console.log('conversation_typing table does not exist yet');
              return res.status(200).json({ success: true });
            }
            console.error('Error updating typing status:', upsertError);
            return res.status(500).json({ error: "Failed to update typing status" });
          }
        } catch (error) {
          console.error('Error in typing update:', error);
          return res.status(200).json({ success: true });
        }
      } else {
        // Remove typing status
        try {
          const { error: deleteError } = await supabaseAdmin
            .from('conversation_typing')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id);

          if (deleteError) {
            // If table doesn't exist, just return success
            if (deleteError.code === 'PGRST200') {
              console.log('conversation_typing table does not exist yet');
              return res.status(200).json({ success: true });
            }
            console.error('Error removing typing status:', deleteError);
            return res.status(500).json({ error: "Failed to remove typing status" });
          }
        } catch (error) {
          console.error('Error in typing delete:', error);
          return res.status(200).json({ success: true });
        }
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Typing API error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 