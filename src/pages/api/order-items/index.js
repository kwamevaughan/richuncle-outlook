import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { order_id } = req.query;
      let query = supabaseAdmin
        .from("order_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (order_id) {
        query = query.eq("order_id", order_id);
      }
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error("Order items API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const items = Array.isArray(req.body) ? req.body : [req.body];
      const { data, error } = await supabaseAdmin
        .from("order_items")
        .insert(items)
        .select();

      if (error) {
        throw error;
      }

      return res.status(201).json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error("Create order item error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 