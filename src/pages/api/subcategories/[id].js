import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: "Subcategory ID is required" 
    });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("subcategories")
        .select(`
          *,
          categories(name)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ 
            success: false, 
            error: "Subcategory not found" 
          });
        }
        console.error("Error fetching subcategory:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch subcategory" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error("Subcategory API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = req.body;

      const { data, error } = await supabaseAdmin
        .from("subcategories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating subcategory:", error);
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
      console.error("Subcategory API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("subcategories")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting subcategory:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Subcategory deleted successfully" 
      });
    } catch (error) {
      console.error("Subcategory API error:", error);
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