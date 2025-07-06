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

    // Get session
    const { data: { session }, error } = await supabaseAdmin.auth.getSession(token);

    if (error) {
      return res.status(401).json({ error: "Invalid session" });
    }

    return res.status(200).json({ session });
  } catch (error) {
    console.error("Error in /api/auth/session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 