import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: "Order ID is required" 
        });
      }

      // First, delete all order items for this order
      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .delete()
        .eq("order_id", id);

      if (itemsError) {
        console.error("Error deleting order items:", itemsError);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to delete order items" 
        });
      }

      // Then delete the order itself
      const { error: orderError } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", id);

      if (orderError) {
        console.error("Error deleting order:", orderError);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to delete order" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Order deleted successfully" 
      });

    } catch (error) {
      console.error("Delete order API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: "Method not allowed" 
  });
} 