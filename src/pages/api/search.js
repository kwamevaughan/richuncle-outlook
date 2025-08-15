import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters long" });
    }

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    // Helper for LIKE/ILIKE
    const like = `%${query}%`;
    
    // Parallel search queries for better performance
    const searchPromises = [
      supabaseAdmin
        .from("products")
        .select("id, name, updated_at")
        .or(`name.ilike.${like},sku.ilike.${like}`)
        .eq('is_active', true)
        .limit(10),
      
      supabaseAdmin
        .from("suppliers")
        .select("id, name, updated_at")
        .ilike("name", like)
        .limit(10),
      
      supabaseAdmin
        .from("customers")
        .select("id, name, updated_at")
        .ilike("name", like)
        .eq('is_active', true)
        .limit(10),
      
      supabaseAdmin
        .from("categories")
        .select("id, name")
        .ilike("name", like)
        .limit(10),
      
      supabaseAdmin
        .from("brands")
        .select("id, name")
        .ilike("name", like)
        .limit(10),
      
      supabaseAdmin
        .from("warehouses")
        .select("id, name, updated_at")
        .ilike("name", like)
        .limit(10),
      
      supabaseAdmin
        .from("stores")
        .select("id, name, updated_at")
        .ilike("name", like)
        .limit(10),
      
      supabaseAdmin
        .from("purchases")
        .select("id, purchase_number, updated_at")
        .ilike("purchase_number", like)
        .limit(10)
    ];

    // Execute all queries in parallel
    const [
      { data: products },
      { data: suppliers },
      { data: customers },
      { data: categories },
      { data: brands },
      { data: warehouses },
      { data: stores },
      { data: purchases }
    ] = await Promise.all(searchPromises);

    // Transform results efficiently
    const results = {
      Products: (products || []).map(p => ({
        id: p.id,
        title: p.name,
        timestamp: p.updated_at
      })),
      Suppliers: (suppliers || []).map(s => ({
        id: s.id,
        title: s.name,
        timestamp: s.updated_at
      })),
      Customers: (customers || []).map(c => ({
        id: c.id,
        title: c.name,
        timestamp: c.updated_at || c.created_at || new Date().toISOString()
      })),
      Categories: (categories || []).map(cat => ({
        id: cat.id,
        title: cat.name,
        timestamp: null
      })),
      Brands: (brands || []).map(b => ({
        id: b.id,
        title: b.name,
        timestamp: null
      })),
      Warehouses: (warehouses || []).map(w => ({
        id: w.id,
        title: w.name,
        timestamp: w.updated_at || w.created_at || null
      })),
      Stores: (stores || []).map(s => ({
        id: s.id,
        title: s.name,
        timestamp: s.updated_at || s.created_at || null
      })),
      Purchases: (purchases || []).map(p => ({
        id: p.id,
        title: p.purchase_number,
        timestamp: p.updated_at
      }))
    };

    return res.status(200).json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 