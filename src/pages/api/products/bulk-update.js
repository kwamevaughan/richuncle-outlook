import supabaseAdmin from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    // Validate updates
    const validUpdates = updates.filter(update => 
      update.id && 
      typeof update.quantity === 'number' && 
      update.quantity >= 0
    );

    if (validUpdates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    // Batch size for optimal performance
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < validUpdates.length; i += BATCH_SIZE) {
      batches.push(validUpdates.slice(i, i + BATCH_SIZE));
    }

    // Process batches in parallel with limited concurrency
    const MAX_CONCURRENT_BATCHES = 3;
    const results = [];
    
    for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
      const currentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
      
      const batchPromises = currentBatches.map(async (batch) => {
        // Use upsert for better performance
        const { data, error } = await supabaseAdmin
          .from('products')
          .upsert(
            batch.map(({ id, quantity }) => ({ 
              id, 
              quantity,
              updated_at: new Date().toISOString()
            })),
            { 
              onConflict: 'id',
              ignoreDuplicates: false 
            }
          )
          .select('id');
        
        return { data, error, batchSize: batch.length };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Aggregate results
    let totalUpdated = 0;
    let totalFailed = 0;
    const errors = [];

    results.forEach(({ data, error, batchSize }) => {
      if (error) {
        totalFailed += batchSize;
        errors.push(error.message);
      } else {
        totalUpdated += data?.length || batchSize;
      }
    });

    if (errors.length > 0) {
      console.warn('Some batch updates failed:', errors);
    }

    res.status(200).json({ 
      success: true, 
      updated: totalUpdated,
      failed: totalFailed,
      total: validUpdates.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update products' });
  }
}