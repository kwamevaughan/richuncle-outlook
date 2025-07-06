import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: "Stock transfer ID is required" 
    });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("stock_transfers")
        .select(`
          id,
          transfer_number,
          status,
          source_type,
          source_id,
          destination_type,
          destination_id,
          transfer_date,
          expected_delivery_date,
          actual_delivery_date,
          created_by,
          approved_by,
          received_by,
          notes,
          shipping_method,
          tracking_number,
          created_at,
          updated_at
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ 
            success: false, 
            error: "Stock transfer not found" 
          });
        }
        console.error("Error fetching stock transfer:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch stock transfer" 
        });
      }

      // Fetch related data
      let sourceName = null;
      let destinationName = null;

      // Get source name
      if (data.source_type === 'store') {
        const { data: storeData } = await supabaseAdmin
          .from('stores')
          .select('name')
          .eq('id', data.source_id)
          .single();
        sourceName = storeData?.name;
      } else if (data.source_type === 'warehouse') {
        const { data: warehouseData } = await supabaseAdmin
          .from('warehouses')
          .select('name')
          .eq('id', data.source_id)
          .single();
        sourceName = warehouseData?.name;
      }

      // Get destination name
      if (data.destination_type === 'store') {
        const { data: storeData } = await supabaseAdmin
          .from('stores')
          .select('name')
          .eq('id', data.destination_id)
          .single();
        destinationName = storeData?.name;
      } else if (data.destination_type === 'warehouse') {
        const { data: warehouseData } = await supabaseAdmin
          .from('warehouses')
          .select('name')
          .eq('id', data.destination_id)
          .single();
        destinationName = warehouseData?.name;
      }

      const transferWithRelatedData = {
        ...data,
        source_name: sourceName,
        destination_name: destinationName
      };

      return res.status(200).json({ 
        success: true, 
        data: transferWithRelatedData 
      });
    } catch (error) {
      console.error("Stock transfer API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = req.body;

      const { data, error } = await supabaseAdmin
        .from("stock_transfers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating stock transfer:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error("Stock transfer API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("stock_transfers")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting stock transfer:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Stock transfer deleted successfully" 
      });
    } catch (error) {
      console.error("Stock transfer API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }
} 