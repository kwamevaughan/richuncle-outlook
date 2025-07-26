import { supabaseServer } from "@/lib/supabase";

export default async function handler(req, res) {
  const supabase = supabaseServer(req, res);
  if (req.method === "GET") {
    // Fetch all role-permission assignments
    const { data, error } = await supabase
      .from("role_permissions")
      .select("role_id, permission_id");
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  }
  if (req.method === "POST") {
    // Assign permission(s) to a role
    const { role_id, permission_ids } = req.body;
    if (!role_id || !Array.isArray(permission_ids)) {
      return res.status(400).json({ success: false, error: "role_id and permission_ids[] required" });
    }
    // Remove all current assignments for this role
    await supabase.from("role_permissions").delete().eq("role_id", role_id);
    // Insert new assignments
    const inserts = permission_ids.map(pid => ({ role_id, permission_id: pid }));
    const { error } = await supabase.from("role_permissions").insert(inserts);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true });
  }
  if (req.method === "DELETE") {
    // Remove a specific permission from a role
    const { role_id, permission_id } = req.body;
    if (!role_id || !permission_id) {
      return res.status(400).json({ success: false, error: "role_id and permission_id required" });
    }
    const { error } = await supabase.from("role_permissions").delete().eq("role_id", role_id).eq("permission_id", permission_id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ success: false, error: "Method not allowed" });
} 