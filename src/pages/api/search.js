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

    // Helper for LIKE/ILIKE
    const like = `%${query}%`;
    const results = {};

    // Products
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, updated_at")
      .ilike("name", like)
      .limit(10);
    results.Products = (products || []).map(p => ({
      id: p.id,
      title: p.name,
      timestamp: p.updated_at
    }));

    // Suppliers
    const { data: suppliers } = await supabaseAdmin
      .from("suppliers")
      .select("id, name, updated_at")
      .ilike("name", like)
      .limit(10);
    results.Suppliers = (suppliers || []).map(s => ({
      id: s.id,
      title: s.name,
      timestamp: s.updated_at
    }));

    // Customers
    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id, name, updated_at")
      .ilike("name", like)
      .limit(10);
    results.Customers = (customers || []).map(c => ({
      id: c.id,
      title: c.name,
      timestamp: c.updated_at || c.created_at || new Date().toISOString()
    }));

    // Categories
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .ilike("name", like)
      .limit(10);
    results.Categories = (categories || []).map(cat => ({
      id: cat.id,
      title: cat.name,
      timestamp: null
    }));

    // Brands
    const { data: brands } = await supabaseAdmin
      .from("brands")
      .select("id, name")
      .ilike("name", like)
      .limit(10);
    results.Brands = (brands || []).map(b => ({
      id: b.id,
      title: b.name,
      timestamp: null
    }));

    // Warehouses
    const { data: warehouses } = await supabaseAdmin
      .from("warehouses")
      .select("id, name, updated_at")
      .ilike("name", like)
      .limit(10);
    results.Warehouses = (warehouses || []).map(w => ({
      id: w.id,
      title: w.name,
      timestamp: w.updated_at || w.created_at || null
    }));

    // Stores
    const { data: stores } = await supabaseAdmin
      .from("stores")
      .select("id, name, updated_at")
      .ilike("name", like)
      .limit(10);
    results.Stores = (stores || []).map(s => ({
      id: s.id,
      title: s.name,
      timestamp: s.updated_at || s.created_at || null
    }));

    // Purchases
    const { data: purchases } = await supabaseAdmin
      .from("purchases")
      .select("id, purchase_number, updated_at")
      .ilike("purchase_number", like)
      .limit(10);
    results.Purchases = (purchases || []).map(p => ({
      id: p.id,
      title: p.purchase_number,
      timestamp: p.updated_at
    }));

    return res.status(200).json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 