import supabaseAdmin from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("purchases")
        .select(`
          id,
          purchase_number,
          supplier_id,
          date,
          status,
          total,
          notes,
          warehouse_id,
          created_at,
          updated_at,
          suppliers(name),
          warehouses(name)
        `)
        .order("created_at", { ascending: false });
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      // Flatten supplier and warehouse name
      const result = (data || []).map(row => ({
        ...row,
        supplier_name: row.suppliers?.name || null,
        warehouse_name: row.warehouses?.name || null
      }));
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const purchase = req.body;
      purchase.id = purchase.id || randomUUID();
      purchase.purchase_number = purchase.purchase_number || `PUR-${Math.floor(Math.random()*1000000)}`;
      purchase.created_at = new Date().toISOString();
      purchase.updated_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("purchases")
        .insert([purchase])
        .select()
        .single();
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ success: false, error: "ID is required" });
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("purchases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, error: "ID is required" });
      const { error } = await supabaseAdmin
        .from("purchases")
        .delete()
        .eq("id", id);
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, message: "Purchase deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
} 