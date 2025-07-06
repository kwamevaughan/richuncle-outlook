import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user data from the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, avatar_url, is_active, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      id: userData.id,
      email: userData.email,
      name: userData.full_name,
      role: userData.role,
      avatar_url: userData.avatar_url,
      is_active: userData.is_active,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 