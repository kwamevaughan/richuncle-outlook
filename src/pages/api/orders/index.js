import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { 
        register_id, 
        session_id, 
        id, 
        limit = '50', 
        offset = '0',
        status,
        date_from,
        date_to
      } = req.query;
      
      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      let query = supabaseAdmin
        .from("orders")
        .select(`
          *,
          payment_receiver_user:payment_receiver(
            id,
            full_name,
            email
          )
        `);
      if (id) {
        query = query.eq("id", id).single();
      } else {
        // Add filters
        if (register_id) query = query.eq("register_id", register_id);
        if (session_id) query = query.eq("session_id", session_id);
        if (status) query = query.eq("status", status);
        
        // Date range filters
        if (date_from) query = query.gte("timestamp", date_from);
        if (date_to) query = query.lte("timestamp", date_to);
        
        // Pagination
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        query = query
          .range(offsetNum, offsetNum + limitNum - 1)
          .order("timestamp", { ascending: false });
      }
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (id) {
        // Single order fetch
        const order = data;
        const transformedOrder = order
          ? {
              ...order,
              payment_receiver_name:
                order.payment_receiver_user?.full_name ||
                order.payment_receiver_user?.email ||
                "Unknown",
              payment_receiver_user: undefined,
            }
          : null;
        return res.status(200).json({
          success: true,
          data: transformedOrder,
        });
      } else {
        // Multiple orders fetch
        const transformedData =
          data?.map((order) => ({
            ...order,
            payment_receiver_name:
              order.payment_receiver_user?.full_name ||
              order.payment_receiver_user?.email ||
              "Unknown",
            payment_receiver_user: undefined, // Remove the nested object
          })) || [];

        return res.status(200).json({
          success: true,
          data: transformedData,
        });
      }
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