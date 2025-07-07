import { randomUUID } from 'crypto';

let purchaseReturns = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: purchaseReturns });
  }
  if (req.method === 'POST') {
    const ret = req.body;
    ret.id = ret.id || randomUUID();
    ret.return_number = ret.return_number || `PR-${Math.floor(Math.random()*1000000)}`;
    ret.created_at = new Date().toISOString();
    ret.updated_at = new Date().toISOString();
    purchaseReturns.unshift(ret);
    return res.status(201).json({ success: true, data: ret });
  }
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
    const idx = purchaseReturns.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
    purchaseReturns[idx] = { ...purchaseReturns[idx], ...updates, updated_at: new Date().toISOString() };
    return res.status(200).json({ success: true, data: purchaseReturns[idx] });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
    purchaseReturns = purchaseReturns.filter(r => r.id !== id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
} 