import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  if (req.method === "GET") {
    try {
      // Fetch the session
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("cash_register_sessions")
        .select("*")
        .eq("id", id)
        .single();
      if (sessionError || !session) {
        return res.status(404).json({ success: false, error: "Session not found" });
      }

      // Fetch user info for the session
      let userName = null;
      if (session.user_id) {
        const { data: user, error: userError } = await supabaseAdmin
          .from("users")
          .select("full_name, email")
          .eq("id", session.user_id)
          .single();
        if (user && user.full_name) userName = user.full_name;
        else if (user && user.email) userName = user.email;
      }
      session.user = userName;

      // Use opened_at and closed_at, fallback to now if closed_at is null
      const openedAt = session.opened_at;
      const closedAt = session.closed_at || new Date().toISOString();

      // Fetch all orders for this register during the session
      let ordersQuery = supabaseAdmin
        .from("orders")
        .select("*, payment_data")
        .eq("register_id", session.register_id);
      if (openedAt) ordersQuery = ordersQuery.gte("timestamp", openedAt);
      if (closedAt) ordersQuery = ordersQuery.lte("timestamp", closedAt);
      const { data: orders, error: ordersError } = await ordersQuery.order("timestamp", { ascending: true });
      if (ordersError) throw ordersError;

      // Fetch all order items for these orders
      const orderIds = orders.map(o => o.id);
      let orderItems = [];
      if (orderIds.length > 0) {
        const { data: items, error: itemsError } = await supabaseAdmin
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);
        if (itemsError) throw itemsError;
        orderItems = items;
      }

      // Fetch all cash movements for this session
      const { data: movements, error: movementsError } = await supabaseAdmin
        .from("cash_movements")
        .select("*")
        .eq("session_id", id);
      if (movementsError) throw movementsError;

      // Fetch all expenses for this session (if you have an expenses table with session_id or register_id)
      let expenses = [];
      if (openedAt && closedAt) {
        const { data: exp, error: expError } = await supabaseAdmin
          .from("expenses")
          .select("*")
          .eq("register_id", session.register_id)
          .gte("expense_date", openedAt)
          .lte("expense_date", closedAt);
        if (!expError) expenses = exp;
      }

      // --- AGGREGATE SALES SUMMARY TO MATCH UI ---
      let totalSales = 0, totalRefund = 0, totalExpense = 0;
      let paymentBreakdown = {};
      let productsSold = [];
      // Aggregate products sold with payment method tracking
      const productMap = {};
      for (const item of orderItems) {
        // Find the order this item belongs to
        const order = orders.find(o => o.id === item.order_id);
        let paymentMethod = 'other';
        
        if (order) {
          let paymentData = order.payment_data;
          // Parse if string
          if (typeof paymentData === 'string') {
            try {
              paymentData = JSON.parse(paymentData);
            } catch {}
          }
          
          if (paymentData && Array.isArray(paymentData.payments)) {
            // Split payment: use the first payment method or mark as 'mixed'
            if (paymentData.payments.length === 1) {
              paymentMethod = (paymentData.payments[0].method || paymentData.payments[0].paymentType || 'other').toLowerCase();
            } else {
              paymentMethod = 'mixed';
            }
          } else if (paymentData && (paymentData.paymentType || paymentData.method)) {
            // Single payment
            paymentMethod = (paymentData.paymentType || paymentData.method || 'other').toLowerCase();
          } else if (order.payment_method) {
            // Fallback to order.payment_method
            paymentMethod = order.payment_method.toLowerCase();
          }
        }
        
        const key = `${item.product_id}_${paymentMethod}`;
        if (!productMap[key]) {
          productMap[key] = { 
            name: item.name, 
            quantity: 0, 
            total: 0, 
            paymentMethod: paymentMethod 
          };
        }
        productMap[key].quantity += Number(item.quantity || 0);
        productMap[key].total += Number(item.total || 0);
      }
      productsSold = Object.values(productMap);
      // Streamlined payment breakdown: sum all cash, momo, card, other (including split)
      for (const order of orders) {
        let totalOrderAmount = Number(order.total) || 0;
        let paymentData = order.payment_data;
        // Parse if string
        if (typeof paymentData === 'string') {
          try { paymentData = JSON.parse(paymentData); } catch {}
        }
        if (paymentData && Array.isArray(paymentData.payments)) {
          // Split payment: sum each part
          paymentData.payments.forEach(p => {
            const type = (p.method || p.paymentType || 'other').toLowerCase();
            const amt = Number(p.amount) || 0;
            if (!paymentBreakdown[type]) paymentBreakdown[type] = 0;
            paymentBreakdown[type] += amt;
          });
        } else if (paymentData && (paymentData.paymentType || paymentData.method)) {
          // Single payment
          const type = (paymentData.paymentType || paymentData.method || 'other').toLowerCase();
          if (!paymentBreakdown[type]) paymentBreakdown[type] = 0;
          paymentBreakdown[type] += totalOrderAmount;
        } else if (order.payment_method) {
          // Fallback to order.payment_method
          const type = order.payment_method.toLowerCase();
          if (!paymentBreakdown[type]) paymentBreakdown[type] = 0;
          paymentBreakdown[type] += totalOrderAmount;
        } else {
          // Unknown/legacy
          if (!paymentBreakdown['other']) paymentBreakdown['other'] = 0;
          paymentBreakdown['other'] += totalOrderAmount;
        }
        totalSales += totalOrderAmount;
      }
      // Group payment breakdown to cash, momo, card, other
      const groupedBreakdown = {};
      if (paymentBreakdown.cash) groupedBreakdown.cash = paymentBreakdown.cash;
      if (paymentBreakdown.momo) groupedBreakdown.momo = paymentBreakdown.momo;
      if (paymentBreakdown.card) groupedBreakdown.card = paymentBreakdown.card;
      // Any other types
      const otherTotal = Object.entries(paymentBreakdown)
        .filter(([k]) => !['cash', 'momo', 'card'].includes(k))
        .reduce((sum, [, v]) => sum + Number(v), 0);
      if (otherTotal > 0) groupedBreakdown.other = otherTotal;
      // Aggregate expenses
      for (const exp of expenses) {
        totalExpense += Number(exp.amount || 0);
      }
      // Cash in hand: opening_cash + all cash_in - all cash_out
      let cashInHand = Number(session.opening_cash || 0);
      for (const m of movements) {
        if (m.type === 'cash_in') cashInHand += Number(m.amount || 0);
        if (m.type === 'cash_out') cashInHand -= Number(m.amount || 0);
      }
      // --- ROUND ALL MONETARY VALUES TO WHOLE NUMBERS ---
      totalSales = Math.round(totalSales);
      totalRefund = Math.round(totalRefund);
      totalExpense = Math.round(totalExpense);
      cashInHand = Math.round(cashInHand);
      Object.keys(groupedBreakdown).forEach(k => groupedBreakdown[k] = Math.round(groupedBreakdown[k]));
      productsSold = productsSold.map(p => ({ ...p, total: Math.round(p.total) }));
      
      // Sort products by name for better readability
      productsSold.sort((a, b) => a.name.localeCompare(b.name));
      // --- RESPONSE ---
      return res.status(200).json({
        success: true,
        data: {
          session,
          movements,
          expenses,
          totalSales,
          totalRefund,
          totalExpense,
          paymentBreakdown: groupedBreakdown,
          cashInHand,
          productsSold,
        }
      });
    } catch (error) {
      console.error("Z-report API error:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 