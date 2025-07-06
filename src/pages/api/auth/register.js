import supabaseAdmin from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";
const bcrypt = require("bcrypt");

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email,
    password,
    full_name,
    role = "cashier", // Default role
    agency_id,
  } = req.body;

  if (!email || !password || !full_name) {
    return res
      .status(400)
      .json({ error: "Email, password, and full name are required" });
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

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID for the user ID
    const userId = randomUUID();

    // Insert new user
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: userId,
          email,
          password: hashedPassword,
          full_name,
          role,
          agency_id,
          created_at: new Date().toISOString(),
          is_active: true,
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
        agency_id: user.agency_id,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
