import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { sku, excludeId } = req.body;

    if (!sku || !sku.trim()) {
      return res.status(400).json({
        success: false,
        message: 'SKU is required'
      });
    }

    // Build the query
    let query = supabaseAdmin
      .from('products')
      .select('id')
      .eq('sku', sku.trim());

    // Exclude current item when editing
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate SKU'
      });
    }

    res.status(200).json({
      success: true,
      exists: data && data.length > 0
    });

  } catch (error) {
    console.error('Error validating SKU:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate SKU'
    });
  }
}