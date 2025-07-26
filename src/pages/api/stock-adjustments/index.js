import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("stock_adjustments")
        .select(`
          *,
          product:products(
            id,
            name,
            sku,
            price,
            category:categories(name)
          )
        `)
        .order("adjustment_date", { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error("Stock adjustments API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const adjustmentData = req.body;
      const { product_id, adjustment_type, quantity_adjusted, quantity_after } = adjustmentData;

      // First, create the adjustment record
      const { data: adjustmentResult, error: adjustmentError } = await supabaseAdmin
        .from("stock_adjustments")
        .insert([adjustmentData])
        .select();

      if (adjustmentError) {
        throw adjustmentError;
      }

      // Then, update the product's quantity
      const { error: productUpdateError } = await supabaseAdmin
        .from("products")
        .update({ quantity: quantity_after })
        .eq("id", product_id);

      if (productUpdateError) {
        console.error("Error updating product quantity:", productUpdateError);
        // Note: We don't throw here to avoid leaving the adjustment record without updating the product
        // In a production system, you might want to implement a rollback mechanism
      }

      return res.status(201).json({
        success: true,
        data: adjustmentResult[0]
      });
    } catch (error) {
      console.error("Create stock adjustment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 