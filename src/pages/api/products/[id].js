import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: "Product ID is required" 
    });
  }

  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          cost_price,
          quantity,
          sku,
          barcode,
          category_id,
          brand_id,
          unit_id,
          store_id,
          warehouse_id,
          image_url,
          tax_type,
          tax_percentage,
          variant_attributes,
          is_active,
          created_at,
          updated_at,
          categories(name),
          brands(name),
          units(name),
          stores(name),
          warehouses(name)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ 
            success: false, 
            error: "Product not found" 
          });
        }
        console.error("Error fetching product:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch product" 
        });
      }

      // Transform the data to flatten the nested join results
      const transformedData = {
        ...data,
        category_name: data.categories?.name || null,
        brand_name: data.brands?.name || null,
        unit_name: data.units?.name || null,
        store_name: data.stores?.name || null,
        warehouse_name: data.warehouses?.name || null
      };

      return res.status(200).json({ 
        success: true, 
        data: transformedData
      });
    } catch (error) {
      console.error("Product API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "PUT") {
    try {
      const updateData = req.body;

      const { data, error } = await supabaseAdmin
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating product:", error);
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
      console.error("Product API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting product:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Product deleted successfully" 
      });
    } catch (error) {
      console.error("Product API error:", error);
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