// Manage user WebAuthn credentials
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Get user credentials
    try {
      const { data, error } = await supabaseAdmin
        .from('user_credentials')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credentials:', error);
        return res.status(500).json({ error: 'Failed to fetch credentials' });
      }

      return res.status(200).json({
        success: true,
        data: data || [],
      });
    } catch (error) {
      console.error('Error in credentials GET:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    // Delete all user credentials (disable biometric auth)
    try {
      const { error } = await supabaseAdmin
        .from('user_credentials')
        .delete()
        .eq('user_id', id);

      if (error) {
        console.error('Error deleting credentials:', error);
        return res.status(500).json({ error: 'Failed to delete credentials' });
      }

      return res.status(200).json({
        success: true,
        message: 'All credentials deleted successfully',
      });
    } catch (error) {
      console.error('Error in credentials DELETE:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}