import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("subcategories")
        .select(`
          *,
          categories(name)
        `)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching subcategories:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch subcategories" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: data || [] 
      });
    } catch (error) {
      console.error("Subcategories API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "POST") {
    try {
      const subcategoryData = req.body;

      const { data, error } = await supabaseAdmin
        .from("subcategories")
        .insert([subcategoryData])
        .select()
        .single();

      if (error) {
        console.error("Error creating subcategory:", error);
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
      console.error("Subcategories API error:", error);
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