import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("expense_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching expense categories:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch expense categories" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: data || [] 
      });
    } catch (error) {
      console.error("Expense categories API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "POST") {
    try {
      const categoryData = req.body;

      const { data, error } = await supabaseAdmin
        .from("expense_categories")
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error("Error creating expense category:", error);
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
      console.error("Expense categories API error:", error);
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