import supabaseAdmin from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Get all items for a given sales_return_id
    const { sales_return_id } = req.query;
    if (!sales_return_id) {
      return res.status(400).json({ success: false, error: "sales_return_id is required" });
    }
    const { data, error } = await supabaseAdmin
      .from("sales_return_items")
      .select("*")
      .eq("sales_return_id", sales_return_id)
      .order("created_at", { ascending: true });
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(200).json({ success: true, data: data || [] });
  }

  if (req.method === "POST") {
    // Replace all items for a given sales_return_id
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: "Array required" });
    }
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: "No items provided" });
    }
    const sales_return_id = items[0].sales_return_id;
    if (!sales_return_id) {
      return res.status(400).json({ success: false, error: "sales_return_id is required in items" });
    }
    // Delete old items
    const { error: delError } = await supabaseAdmin
      .from("sales_return_items")
      .delete()
      .eq("sales_return_id", sales_return_id);
    if (delError) {
      return res.status(500).json({ success: false, error: delError.message });
    }
    // Insert new items
    const now = new Date().toISOString();
    const newItems = items.map(item => ({
      id: item.id || randomUUID(),
      sales_return_id: item.sales_return_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      reason: item.reason || null,
      reason_text: item.reason_text || null,
      created_at: now,
      updated_at: now,
    }));
    try {
      const { data, error } = await supabaseAdmin
        .from("sales_return_items")
        .insert(newItems)
        .select();
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(201).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === "DELETE") {
    // Delete all items for a given sales_return_id
    const { sales_return_id } = req.body;
    if (!sales_return_id) {
      return res.status(400).json({ success: false, error: "sales_return_id is required" });
    }
    const { error } = await supabaseAdmin
      .from("sales_return_items")
      .delete()
      .eq("sales_return_id", sales_return_id);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(200).json({ success: true, message: "Deleted" });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
} 