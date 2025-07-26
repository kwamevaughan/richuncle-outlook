import supabaseAdmin from "@/lib/supabaseAdmin";
const bcrypt = require("bcrypt");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }

  const { id } = req.query;
  const { currentPassword, newPassword } = req.body;

  if (!id || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      error: "User ID, current password, and new password are required" 
    });
  }

  try {
    // Get current user data
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, password")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: "Current password is incorrect" 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ 
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to update password" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Change password API error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
} 