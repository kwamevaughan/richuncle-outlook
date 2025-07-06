const bcrypt = require("bcrypt");
import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, avatar_url, is_active, created_at, updated_at, password")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.error("API: User not found:", userError);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is active
    if (!userData.is_active) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    if (!userData.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await supabaseAdmin
      .from("users")
      .update({ last_login: new Date().toISOString(), last_ip: clientIp })
      .eq("id", userData.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userData;

    return res.status(200).json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("API: Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
