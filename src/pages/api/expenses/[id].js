import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: "Expense ID is required" 
    });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("expenses")
        .select(`
          *,
          expense_category:expense_categories(name)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ 
            success: false, 
            error: "Expense not found" 
          });
        }
        console.error("Error fetching expense:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch expense" 
        });
      }

      // Transform the data to flatten the nested join results
      const transformedData = {
        ...data,
        category_name: data.expense_category?.name || null
      };

      return res.status(200).json({ 
        success: true, 
        data: transformedData
      });
    } catch (error) {
      console.error("Expense API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = req.body;

      const { data, error } = await supabaseAdmin
        .from("expenses")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating expense:", error);
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
      console.error("Expense API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting expense:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Expense deleted successfully" 
      });
    } catch (error) {
      console.error("Expense API error:", error);
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