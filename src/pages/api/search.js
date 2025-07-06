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

    // Define the tables to search
    const tables = [
      "business_opportunities",
      "events", 
      "resources",
      "market_intel",
      "offers",
      "updates"
    ];

    const results = {};

    // Search each table
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("id, title, tier_restriction, created_at, updated_at")
          .ilike("title", `%${query}%`)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error(`Error searching ${table}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          const sectionName = table.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          results[sectionName] = data.map(item => ({
            id: item.id,
            title: item.title,
            timestamp: item.updated_at || item.created_at,
          }));
        }
      } catch (error) {
        console.error(`Error searching ${table}:`, error);
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 