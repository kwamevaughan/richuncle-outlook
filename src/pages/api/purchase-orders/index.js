import { randomUUID } from 'crypto';

let purchaseOrders = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: purchaseOrders });
  }
  if (req.method === 'POST') {
    const order = req.body;
    order.id = order.id || randomUUID();
    order.order_number = order.order_number || `PO-${Math.floor(Math.random()*1000000)}`;
    order.created_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();
    purchaseOrders.unshift(order);
    return res.status(201).json({ success: true, data: order });
  }
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
    const idx = purchaseOrders.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
    purchaseOrders[idx] = { ...purchaseOrders[idx], ...updates, updated_at: new Date().toISOString() };
    return res.status(200).json({ success: true, data: purchaseOrders[idx] });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
    purchaseOrders = purchaseOrders.filter(o => o.id !== id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
} 