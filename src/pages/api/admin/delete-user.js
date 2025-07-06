import supabaseAdmin from "@/lib/supabaseAdmin";

const handler = async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
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

    // Delete from users table
    const { error: profileError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (profileError) {
      throw profileError;
    }

    return res.status(200).json({ 
      message: "User deleted successfully",
      deletedUser: {
        id: existingUser.id,
        email: existingUser.email
      }
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler; 