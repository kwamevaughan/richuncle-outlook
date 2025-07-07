import supabaseAdmin from '@/lib/supabaseAdmin';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all items for a given purchase_id
    const { purchase_id } = req.query;
    if (!purchase_id) {
      return res.status(400).json({ success: false, error: 'purchase_id is required' });
    }
    const { data, error } = await supabaseAdmin
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', purchase_id)
      .order('created_at', { ascending: true });
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(200).json({ success: true, data: data || [] });
  }

  if (req.method === 'POST') {
    // Replace all items for a given purchase_id
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Array required' });
    }
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items provided' });
    }
    const purchase_id = items[0].purchase_id;
    if (!purchase_id) {
      return res.status(400).json({ success: false, error: 'purchase_id is required in items' });
    }
    // Delete old items
    const { error: delError } = await supabaseAdmin
      .from('purchase_items')
      .delete()
      .eq('purchase_id', purchase_id);
    if (delError) {
      console.error('Error deleting old purchase_items:', delError.message);
      return res.status(500).json({ success: false, error: delError.message });
    }
    // Insert new items
    const now = new Date().toISOString();
    const newItems = items.map(item => ({
      id: item.id || randomUUID(),
      purchase_id: item.purchase_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total: item.total,
      created_at: now,
      updated_at: now,
    }));
    try {
      console.log('Inserting purchase_items:', JSON.stringify(newItems, null, 2));
      const { data, error } = await supabaseAdmin
        .from('purchase_items')
        .insert(newItems)
        .select();
      if (error) {
        console.error('Error inserting purchase_items:', error.message, error.details || '', error.hint || '');
        return res.status(500).json({ success: false, error: error.message, details: error.details, hint: error.hint });
      }
      return res.status(201).json({ success: true, data });
    } catch (err) {
      console.error('Unexpected error inserting purchase_items:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    // Delete all items for a given purchase_id
    const { purchase_id } = req.body;
    if (!purchase_id) {
      return res.status(400).json({ success: false, error: 'purchase_id is required' });
    }
    const { error } = await supabaseAdmin
      .from('purchase_items')
      .delete()
      .eq('purchase_id', purchase_id);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(200).json({ success: true, message: 'Deleted' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
} 