import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error("API: Supabase auth error:", authError);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Fetch user data from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, role, avatar_url, is_active, created_at, updated_at")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      console.error("API: User not found:", userError);
      return res.status(401).json({ error: "No account found for this email" });
    }

    // Update last login
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString(), last_ip: clientIp })
      .eq("id", authData.user.id);

    return res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        avatar_url: userData.avatar_url,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      },
    });
  } catch (error) {
    console.error("API: Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
