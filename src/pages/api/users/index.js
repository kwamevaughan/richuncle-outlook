import supabaseAdmin from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";
const bcrypt = require("bcrypt");

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select(`
          id,
          email,
          full_name,
          role,
          avatar_url,
          avatar_file_id,
          is_active,
          created_at,
          updated_at,
          last_login,
          store_id
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch users" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: data || [] 
      });
    } catch (error) {
      console.error("Users API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "POST") {
    try {
      const userData = req.body;

      // Convert empty strings to null for UUID fields to prevent database errors
      const uuidFields = ['store_id', 'avatar_file_id'];
      uuidFields.forEach(field => {
        if (userData[field] === "") {
          userData[field] = null;
        }
      });

      // Generate UUID if not provided
      if (!userData.id) {
        userData.id = randomUUID();
      }

      // Hash password if present
      if (userData.password) {
        const saltRounds = 10;
        userData.password = await bcrypt.hash(userData.password, saltRounds);
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error("Error creating user:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(201).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error("Users API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }
} 