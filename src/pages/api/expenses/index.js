import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("expenses")
        .select(`
          *,
          expense_category:expense_categories(name)
        `)
        .order("expense_date", { ascending: false });

      if (error) {
        console.error("Error fetching expenses:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch expenses" 
        });
      }

      // Transform the data to flatten the nested join results
      const transformedData = (data || []).map(expense => ({
        ...expense,
        category_name: expense.expense_category?.name || null
      }));

      return res.status(200).json({ 
        success: true, 
        data: transformedData
      });
    } catch (error) {
      console.error("Expenses API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "POST") {
    try {
      const expenseData = req.body;

      const { data, error } = await supabaseAdmin
        .from("expenses")
        .insert([expenseData])
        .select()
        .single();

      if (error) {
        console.error("Error creating expense:", error);
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
      console.error("Expenses API error:", error);
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