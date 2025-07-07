import { randomUUID } from 'crypto';

let purchaseReturnItems = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { purchase_return_id } = req.query;
    const items = purchaseReturnItems.filter(i => i.purchase_return_id === purchase_return_id);
    return res.status(200).json({ success: true, data: items });
  }
  if (req.method === 'POST') {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'Array required' });
    // Remove old items for this purchase_return_id
    if (items.length > 0) {
      const purchase_return_id = items[0].purchase_return_id;
      purchaseReturnItems = purchaseReturnItems.filter(i => i.purchase_return_id !== purchase_return_id);
    }
    // Add new items
    const newItems = items.map(item => ({ ...item, id: item.id || randomUUID() }));
    purchaseReturnItems.push(...newItems);
    return res.status(201).json({ success: true, data: newItems });
  }
  if (req.method === 'DELETE') {
    const { purchase_return_id } = req.body;
    purchaseReturnItems = purchaseReturnItems.filter(i => i.purchase_return_id !== purchase_return_id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
} 