import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Updates array is required" });
    }

    const { error } = await supabaseAdmin
      .from("products")
      .upsert(updates);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updates.length} products`
    });
  } catch (error) {
    console.error("Bulk update products error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 