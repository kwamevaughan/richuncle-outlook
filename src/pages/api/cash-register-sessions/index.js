import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { register_id, status } = req.query;
      
      let query = supabaseAdmin
        .from("cash_register_sessions")
        .select("*")
        .order("opened_at", { ascending: false });

      if (register_id) {
        query = query.eq("register_id", register_id);
      }
      
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error("Cash register sessions API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { data, error } = await supabaseAdmin
        .from("cash_register_sessions")
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
      console.error("Create cash register session error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 