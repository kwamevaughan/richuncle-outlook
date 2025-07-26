import supabaseAdmin from "@/lib/supabaseAdmin";
const bcrypt = require("bcrypt");

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: "User ID is required" 
    });
  }

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
          crop_transform,
          is_active,
          created_at,
          updated_at,
          last_login,
          store_id
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ 
            success: false, 
            error: "User not found" 
          });
        }
        console.error("Error fetching user:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch user" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error("User API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = req.body;

      // Convert empty strings to null for UUID fields to prevent database errors
      const uuidFields = ['store_id', 'avatar_file_id'];
      uuidFields.forEach(field => {
        if (updateData[field] === "") {
          updateData[field] = null;
        }
      });

      // Hash password if present
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error("User API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting user:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "User deleted successfully" 
      });
    } catch (error) {
      console.error("User API error:", error);
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