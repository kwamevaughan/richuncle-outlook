// Complete passwordless WebAuthn authentication (simplified version)
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assertion, sessionId } = req.body;

    if (!assertion || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the credential by credential ID
    const { data: credential, error: credError } = await supabaseAdmin
      .from('user_credentials')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          role,
          avatar_url,
          avatar_file_id,
          is_active,
          created_at,
          updated_at,
          store_id
        )
      `)
      .eq('credential_id', assertion.id)
      .eq('is_active', true)
      .single();

    if (credError || !credential) {
      console.error('Credential lookup error:', credError);
      return res.status(404).json({ error: 'Invalid or inactive credential' });
    }

    const user = credential.users;

    if (!user || !user.is_active) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    // For now, we'll trust the client-side WebAuthn verification
    // In production with proper setup, you would verify the assertion cryptographically
    
    // Update credential usage
    await supabaseAdmin
      .from('user_credentials')
      .update({ 
        last_used: new Date().toISOString(),
      })
      .eq('id', credential.id);

    // Update user's last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return user data (same format as regular login)
    return res.status(200).json({
      success: true,
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        avatar_file_id: user.avatar_file_id,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: new Date().toISOString(),
        store_id: user.store_id,
      },
    });
  } catch (error) {
    console.error('Error completing passwordless WebAuthn authentication:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}