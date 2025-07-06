// pages/api/auth/logout.js

import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    // Sign out the user
    const { error } = await supabaseAdmin.auth.admin.signOut(token);

    if (error) {
      console.error("Logout error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in /api/auth/logout:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
