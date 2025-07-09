import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          payment_receiver_user:payment_receiver(
            id,
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to include payment receiver name
      const transformedData = data?.map(order => ({
        ...order,
        payment_receiver_name: order.payment_receiver_user?.full_name || order.payment_receiver_user?.email || 'Unknown',
        payment_receiver_user: undefined // Remove the nested object
      })) || [];

      return res.status(200).json({
        success: true,
        data: transformedData
      });
    } catch (error) {
      console.error("Orders API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
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
      console.error("Create order error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { id, ...updates } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Order ID is required" });
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        throw error;
      }
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Update order error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 