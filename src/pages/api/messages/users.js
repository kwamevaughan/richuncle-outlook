import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user from request body
    const { user, role, search } = req.body;

    if (!user || !user.id) {
      return res.status(401).json({ error: "Unauthorized - User information required" });
    }



    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, avatar_url, is_active')
      .eq('is_active', true)
      .neq('id', user.id); // Exclude current user

    // Filter by role if specified
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    // Add search filter if provided
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query.order('full_name');

    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    // Group users by role for better organization
    const groupedUsers = users.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    return res.status(200).json({ 
      users,
      groupedUsers,
      total: users.length
    });
  } catch (error) {
    console.error("Users API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 