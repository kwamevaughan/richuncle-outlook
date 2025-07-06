const bcrypt = require("bcrypt");
import supabaseAdmin from "@/lib/supabaseAdmin";

const handler = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    id,
    email,
    password,
    full_name,
    role,
    is_active,
    avatar_url
  } = req.body;

  if (!id || !email || !full_name || !role) {
    return res
      .status(400)
      .json({ error: "User ID, email, full name, and role are required" });
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("id", id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is being changed and if it already exists
    if (email !== existingUser.email) {
      const { data: emailExists } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (emailExists) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    // Prepare update data
    const updateData = {
      email,
      full_name,
      role,
      is_active,
      avatar_url,
      updated_at: new Date().toISOString(),
    };

    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update user profile
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
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
    console.error("Update user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler; 