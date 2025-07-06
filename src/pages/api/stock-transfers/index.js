import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching stock transfers:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch stock transfers" 
        });
      }

      // Fetch related data for each transfer
      const transfersWithRelatedData = await Promise.all(
        (data || []).map(async (transfer) => {
          let sourceName = null;
          let destinationName = null;

          // Get source name
          if (transfer.source_type === 'store') {
            const { data: storeData } = await supabaseAdmin
              .from('stores')
              .select('name')
              .eq('id', transfer.source_id)
              .single();
            sourceName = storeData?.name;
          } else if (transfer.source_type === 'warehouse') {
            const { data: warehouseData } = await supabaseAdmin
              .from('warehouses')
              .select('name')
              .eq('id', transfer.source_id)
              .single();
            sourceName = warehouseData?.name;
          }

          // Get destination name
          if (transfer.destination_type === 'store') {
            const { data: storeData } = await supabaseAdmin
              .from('stores')
              .select('name')
              .eq('id', transfer.destination_id)
              .single();
            destinationName = storeData?.name;
          } else if (transfer.destination_type === 'warehouse') {
            const { data: warehouseData } = await supabaseAdmin
              .from('warehouses')
              .select('name')
              .eq('id', transfer.destination_id)
              .single();
            destinationName = warehouseData?.name;
          }

          return {
            ...transfer,
            source_name: sourceName,
            destination_name: destinationName
          };
        })
      );

      return res.status(200).json({ 
        success: true, 
        data: transfersWithRelatedData 
      });
    } catch (error) {
      console.error("Stock transfers API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "POST") {
    try {
      const transferData = req.body;

      const { data, error } = await supabaseAdmin
        .from("stock_transfers")
        .insert([transferData])
        .select()
        .single();

      if (error) {
        console.error("Error creating stock transfer:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(201).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error("Stock transfers API error:", error);
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