import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Store ID is required" });
  }

  if (req.method === "PUT") {
    try {
      const { data, error } = await supabaseAdmin
        .from("stores")
        .update(req.body)
        .eq("id", id)
        .select();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: data[0]
      });
    } catch (error) {
      console.error("Update store error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("stores")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true
      });
    } catch (error) {
      console.error("Delete store error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 