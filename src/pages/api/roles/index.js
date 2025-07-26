import { supabaseServer } from "@/lib/supabase";

export default async function handler(req, res) {
  const supabase = supabaseServer(req, res);
  if (req.method === "GET") {
    // List all roles
    const { data, error } = await supabase.from("roles").select("*");
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  }
  if (req.method === "POST") {
    // Create a new role
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Name is required" });
    const { data, error } = await supabase.from("roles").insert([{ name, description }]).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  }
  if (req.method === "PUT") {
    // Update a role
    const { id, name, description } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });
    const { data, error } = await supabase.from("roles").update({ name, description }).eq("id", id).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  }
  if (req.method === "DELETE") {
    // Delete a role
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ success: false, error: "Method not allowed" });
} 