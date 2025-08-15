import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { start_date, end_date, store_id } = req.query;

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

    // Validate date range
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Build base query
    let ordersQuery = supabaseAdmin
      .from("orders")
      .select(`
        id,
        total,
        payment_method,
        status,
        created_at,
        store_id,
        customer_id
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'Completed');

    // Add store filter if specified
    if (store_id && store_id !== 'all') {
      ordersQuery = ordersQuery.eq('store_id', store_id);
    }

    // Execute the orders query first
    const { data: orders, error: ordersError } = await ordersQuery;
    
    if (ordersError) throw ordersError;
    
    // Get order IDs for filtering order items
    const orderIds = orders.map(order => order.id);
    
    // Only fetch order items if we have orders
    let orderItems = [];
    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .select(`
          order_id,
          quantity,
          price,
          total,
          product_id,
          name
        `)
        .in('order_id', orderIds);
      
      if (itemsError) throw itemsError;
      orderItems = itemsData || [];
    }

    // Process data efficiently
    const orderMap = new Map(orders.map(order => [order.id, order]));
    const validItems = orderItems; // Already filtered by order IDs

    // Calculate metrics
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Group by payment method
    const paymentMethods = orders.reduce((acc, order) => {
      const method = order.payment_method || 'Unknown';
      acc[method] = (acc[method] || 0) + Number(order.total);
      return acc;
    }, {});

    // Group by date for trend analysis
    const dailySales = orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(order.total);
      return acc;
    }, {});

    // Top selling products
    const productSales = validItems.reduce((acc, item) => {
      const key = `${item.product_id}-${item.name}`;
      if (!acc[key]) {
        acc[key] = {
          product_id: item.product_id,
          name: item.name,
          quantity: 0,
          revenue: 0
        };
      }
      acc[key].quantity += Number(item.quantity);
      acc[key].revenue += Number(item.total);
      return acc;
    }, {});

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Prepare chart data
    const chartData = {
      daily: {
        labels: Object.keys(dailySales).sort(),
        datasets: [{
          label: 'Daily Sales',
          data: Object.keys(dailySales).sort().map(date => dailySales[date]),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      paymentMethods: {
        labels: Object.keys(paymentMethods),
        datasets: [{
          data: Object.values(paymentMethods),
          backgroundColor: [
            '#10B981', // Green for cash
            '#3B82F6', // Blue for card
            '#F59E0B', // Amber for mobile money
            '#EF4444', // Red for others
            '#8B5CF6', // Purple for split
          ]
        }]
      }
    };

    const response = {
      success: true,
      data: {
        metrics: {
          totalSales: Math.round(totalSales * 100) / 100,
          totalOrders,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          paymentMethods
        },
        charts: chartData,
        topProducts,
        summary: {
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          store_id: store_id || 'all',
          generated_at: new Date().toISOString()
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error("Sales report API error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to generate sales report" 
    });
  }
}