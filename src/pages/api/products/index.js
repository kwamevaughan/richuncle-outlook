import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
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
          is_active,
          created_at,
          updated_at,
          categories(name),
          brands(name),
          units(name),
          stores(name),
          warehouses(name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to fetch products" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: data || [] 
      });
    } catch (error) {
      console.error("Products API error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  } else if (req.method === "POST") {
    try {
      const productData = req.body;

      const { data, error } = await supabaseAdmin
        .from("products")
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error("Error creating product:", error);
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
      console.error("Products API error:", error);
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