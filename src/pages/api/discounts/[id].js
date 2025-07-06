import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: "Discount ID is required" 
    });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("discounts")
        .select(`
          *,
          discount_plans(name)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ 
            success: false, 
            error: "Discount not found" 
          });
        }
        console.error("Error fetching discount:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch discount" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error("Discount API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = req.body;

      const { data, error } = await supabaseAdmin
        .from("discounts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating discount:", error);
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
      console.error("Discount API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("discounts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting discount:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Discount deleted successfully" 
      });
    } catch (error) {
      console.error("Discount API error:", error);
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