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

      // Check if user is admin or creator of the conversation
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('created_by')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Only allow deletion if user is admin or conversation creator
      if (user.role !== 'admin' && conversation.created_by !== user.id) {
        return res.status(403).json({ error: "Only admins or conversation creators can delete conversations" });
      }

      // Soft delete the conversation (mark as inactive)
      const { error: deleteError } = await supabaseAdmin
        .from('conversations')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', conversationId);

      if (deleteError) {
        console.error('Error deleting conversation:', deleteError);
        return res.status(500).json({ error: "Failed to delete conversation" });
      }

      // Also mark all participants as inactive
      const { error: participantsError } = await supabaseAdmin
        .from('conversation_participants')
        .update({ is_active: false })
        .eq('conversation_id', conversationId);

      if (participantsError) {
        console.error('Error updating participants:', participantsError);
        // Don't fail the request if this fails
      }

      return res.status(200).json({ success: true, message: "Conversation deleted successfully" });
    } catch (error) {
      console.error('Delete conversation error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
} 