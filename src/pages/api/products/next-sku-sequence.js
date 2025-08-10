import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { categoryCode, brandCode, productCode, storePrefix } = req.body;

    // Create the SKU pattern to search for
    const skuPattern = `${storePrefix}-${categoryCode}-${brandCode}-${productCode}`;

    // Get SKUs that start with this pattern
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('sku')
      .like('sku', `${skuPattern}%`)
      .order('sku', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to query database'
      });
    }

    let nextSequence = 1001; // Start from 1001

    if (data && data.length > 0) {
      const lastSku = data[0].sku;
      // Extract the sequence number from the last SKU
      const parts = lastSku.split('-');
      const lastSequence = parseInt(parts[parts.length - 1]);
      
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }

    res.status(200).json({
      success: true,
      nextSequence: nextSequence
    });

  } catch (error) {
    console.error('Error getting next SKU sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next SKU sequence'
    });
  }
}