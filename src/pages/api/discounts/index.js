import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("discounts")
        .select(`
          *,
          discount_plans(name),
          store:stores(name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching discounts:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch discounts" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: data || [] 
      });
    } catch (error) {
      console.error("Discounts API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "POST") {
    try {
      const discountData = req.body;

      const { data, error } = await supabaseAdmin
        .from("discounts")
        .insert([discountData])
        .select()
        .single();

      if (error) {
        console.error("Error creating discount:", error);
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
      console.error("Discounts API error:", error);
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