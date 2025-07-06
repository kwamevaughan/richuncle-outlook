import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, error: "Supplier ID is required" });
  }

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
        .eq("id", id)
        .single();
      if (error) {
        return res.status(404).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = req.body;
      updateData.updated_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("suppliers")
        .update(updateData)
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
      const { error } = await supabaseAdmin
        .from("suppliers")
        .delete()
        .eq("id", id);
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, message: "Supplier deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
} 