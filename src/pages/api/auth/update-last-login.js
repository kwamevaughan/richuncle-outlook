import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Update last login timestamp
    const { error } = await supabaseAdmin
      .from("users")
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating last login:", error);
      return res.status(500).json({ error: "Failed to update last login" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /api/auth/update-last-login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 