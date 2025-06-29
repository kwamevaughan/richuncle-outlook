// pages/api/auth/verify-token.js
import { supabaseServer } from "@/lib/supabase";

export default async function handler(req, res) {
  try {
    const supabase = supabaseServer(req);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }
    const { data, error: dbError } = await supabase
      .from("users")
      .select("id, email, full_name, role, avatar_url, is_active, created_at, updated_at")
      .eq("id", user.id)
      .single();
    if (dbError || !data) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      user: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        avatar_url: data.avatar_url,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (err) {
    console.error("API: Verify token error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
