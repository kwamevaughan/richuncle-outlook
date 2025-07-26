import { supabaseServer } from "@/lib/supabase";

export default async function handler(req, res) {
  const supabase = supabaseServer(req, res);
  if (req.method === "GET") {
    // List all permissions
    const { data, error } = await supabase.from("permissions").select("*");
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  }
  if (req.method === "POST") {
    // Create a new permission
    const { key, label } = req.body;
    if (!key || !label) return res.status(400).json({ success: false, error: "Key and label are required" });
    const { data, error } = await supabase.from("permissions").insert([{ key, label }]).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  }
  if (req.method === "PUT") {
    // Update a permission
    const { id, key, label } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });
    const { data, error } = await supabase.from("permissions").update({ key, label }).eq("id", id).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  }
  if (req.method === "DELETE") {
    // Delete a permission
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });
    const { error } = await supabase.from("permissions").delete().eq("id", id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ success: false, error: "Method not allowed" });
} 