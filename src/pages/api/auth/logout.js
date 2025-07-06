// pages/api/auth/logout.js

import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // For localStorage-based auth, we don't need to validate a token
    // Just return success since the client will clear localStorage
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in /api/auth/logout:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
