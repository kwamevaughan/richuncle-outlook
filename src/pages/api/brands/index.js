import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error("Brands API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { data, error } = await supabaseAdmin
        .from("brands")
        .insert([req.body])
        .select();

      if (error) {
        throw error;
      }

      return res.status(201).json({
        success: true,
        data: data[0]
      });
    } catch (error) {
      console.error("Create brand error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 