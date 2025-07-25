import supabaseAdmin from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("sales_returns")
        .select(`
          id,
          return_number,
          customer_id,
          warehouse_id,
          store_id,
          date,
          status,
          total,
          notes,
          reference,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const ret = req.body;
      ret.id = ret.id || randomUUID();
      ret.return_number = ret.return_number || `SR-${Math.floor(Math.random()*1000000)}`;
      ret.created_at = new Date().toISOString();
      ret.updated_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("sales_returns")
        .insert([ret])
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
        .from("sales_returns")
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
        .from("sales_returns")
        .delete()
        .eq("id", id);
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, message: "Sales return deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
} 