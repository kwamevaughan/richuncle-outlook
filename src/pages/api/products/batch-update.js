import supabaseAdmin from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "Updates array is required" });
    }

    // Batch update using Promise.all for parallel execution
    const updatePromises = updates.map(async ({ id, quantity }) => {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ quantity })
        .eq("id", id);

      return { id, success: !error, error };
    });

    const results = await Promise.all(updatePromises);

    // Check for any failures
    const failures = results.filter((r) => !r.success);

    if (failures.length > 0) {
      console.warn("Some stock updates failed:", failures);
    }

    res.status(200).json({
      success: true,
      updated: results.length - failures.length,
      failed: failures.length,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error) {
    console.error("Batch update error:", error);
    res.status(500).json({ error: "Failed to update products" });
  }
}
