import supabaseAdmin from "@/lib/supabaseAdmin";
import { randomUUID } from 'crypto';


export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Adjust the select as needed for joins
      const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name),
          warehouse:warehouses(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Map DB fields to frontend expectations
      const transformed = (data || []).map(order => ({
        ...order,
        order_number: order.po_number,
        date: order.order_date,
        total: order.total_amount,
        supplier_name: order.supplier?.name || '',
        warehouse_name: order.warehouse?.name || '',
      }));
      return res.status(200).json({ success: true, data: transformed });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  if (req.method === 'POST') {
    try {
      const order = req.body;
      order.id = order.id || randomUUID();
      order.po_number = order.po_number || `PO-${Math.floor(Math.random()*1000000)}`;
      order.created_at = new Date().toISOString();
      order.updated_at = new Date().toISOString();
      order.order_date = order.date || order.order_date;
      delete order.date;
      const allowedStatuses = ['draft', 'pending', 'approved', 'received', 'cancelled'];
      order.status = (order.status || 'draft').toLowerCase();
      if (!allowedStatuses.includes(order.status)) order.status = 'draft';
      const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .insert([order])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
      updates.updated_at = new Date().toISOString();
      updates.order_date = updates.date || updates.order_date;
      delete updates.date;
      const allowedStatuses = ['draft', 'pending', 'approved', 'received', 'cancelled'];
      updates.status = (updates.status || 'draft').toLowerCase();
      if (!allowedStatuses.includes(updates.status)) updates.status = 'draft';
      const { data, error } = await supabaseAdmin
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      
      // Validate that id is provided and is a string
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Valid ID string is required' 
        });
      }
      
      // Validate that id is a proper UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid UUID format' 
        });
      }
      
      const { error } = await supabaseAdmin
        .from('purchase_orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
} 