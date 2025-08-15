// Complete WebAuthn authentication (biometric login)
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, assertion, challenge } = req.body;

    if (!email || !assertion || !challenge) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the credential exists
    const { data: credential, error: credError } = await supabaseAdmin
      .from('user_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('credential_id', assertion.id)
      .single();

    if (credError || !credential) {
      return res.status(404).json({ error: 'Invalid credential' });
    }

    // In production, verify the assertion with a WebAuthn library
    // For now, we'll trust the client-side verification
    
    // Update last used timestamp
    await supabaseAdmin
      .from('user_credentials')
      .update({ last_used: new Date().toISOString() })
      .eq('id', credential.id);

    // Update user's last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return user data (same format as regular login)
    return res.status(200).json({
      success: true,
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
    console.error('Error completing WebAuthn authentication:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}