import supabaseAdmin from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("suppliers")
        .select(`
          id,
          name,
          email,
          phone,
          address,
          company,
          is_active,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, data: data || [] });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const supplier = req.body;
      if (!supplier.name) {
        return res.status(400).json({ success: false, error: "Name is required" });
      }
      supplier.id = randomUUID();
      supplier.created_at = new Date().toISOString();
      supplier.updated_at = new Date().toISOString();
      if (typeof supplier.is_active === "undefined") supplier.is_active = true;
      const { data, error } = await supabaseAdmin
        .from("suppliers")
        .insert([supplier])
        .select()
        .single();
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
} 