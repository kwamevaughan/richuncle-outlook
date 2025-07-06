const bcrypt = require("bcrypt");
import supabaseAdmin from "@/lib/supabaseAdmin";

// Generate a UUID for the user ID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email,
    password,
    full_name,
    role,
    is_active = true,
    avatar_url = ""
  } = req.body;

  if (!email || !full_name || !role) {
    return res
      .status(400)
      .json({ error: "Email, full name, and role are required" });
  }

  try {
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Generate a random password if not provided
    let userPassword = password;
    if (!userPassword) {
      userPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    // Generate UUID for the user ID
    const userId = generateUUID();

    // Insert user in our users table
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: userId,
          email,
          password: hashedPassword,
          full_name,
          role,
          is_active,
          avatar_url,
          created_at: new Date().toISOString(),
          email_verified: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler; 