import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - User ID required' });
  }

  try {
    // Create test notifications
    const testNotifications = [
      {
        user_id: userId,
        type: 'new_order',
        title: 'New Order Received',
        message: 'Order #12345 has been placed by John Doe',
        data: { order_id: '12345', customer_name: 'John Doe' },
        read: false,
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Product "iPhone 15 Pro" is running low on stock (5 units remaining)',
        data: { product_name: 'iPhone 15 Pro', quantity: 5 },
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      },
      {
        user_id: userId,
        type: 'out_of_stock',
        title: 'Out of Stock Alert',
        message: 'Product "Samsung Galaxy S24" is now out of stock',
        data: { product_name: 'Samsung Galaxy S24', quantity: 0 },
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      {
        user_id: userId,
        type: 'long_running_register',
        title: 'Long-Running Register Session',
        message: 'Register #1 has been open for more than 24 hours',
        data: { register_id: '1', duration: '26 hours' },
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
      }
    ];

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(testNotifications)
      .select();

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: 'Test notifications created successfully',
      data 
    });
  } catch (error) {
    console.error('Test notifications API error:', error);
    return res.status(500).json({ 
      error: 'An error occurred', 
      details: error.message 
    });
  }
} 