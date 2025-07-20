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
      if (sessionError || !session) throw sessionError || new Error("Session not found");

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

      // Aggregate sales, payments, returns, etc.
      let totalSales = 0, totalReturn = 0, totalPayment = 0;
      let paymentBreakdown = { cash: 0, card: 0, cheque: 0, gift_card: 0, deposit: 0 };
      let productsSold = {};
      for (const order of orders) {
        totalSales += Number(order.total || 0);
        // Payment breakdown (assumes payment_data is an object with type/amount)
        if (order.payment_data) {
          try {
            const pd = typeof order.payment_data === 'string' ? JSON.parse(order.payment_data) : order.payment_data;
            if (pd.paymentType === 'cash') paymentBreakdown.cash += Number(order.total || 0);
            if (pd.paymentType === 'card') paymentBreakdown.card += Number(order.total || 0);
            if (pd.paymentType === 'cheque') paymentBreakdown.cheque += Number(order.total || 0);
            if (pd.paymentType === 'gift_card') paymentBreakdown.gift_card += Number(order.total || 0);
            if (pd.paymentType === 'deposit') paymentBreakdown.deposit += Number(order.total || 0);
            totalPayment += Number(order.total || 0);
          } catch {}
        }
      }
      // Aggregate products sold
      for (const item of orderItems) {
        if (!productsSold[item.product_id]) {
          productsSold[item.product_id] = { name: item.name, quantity: 0, total: 0 };
        }
        productsSold[item.product_id].quantity += Number(item.quantity || 0);
        productsSold[item.product_id].total += Number(item.total || 0);
      }
      // Aggregate returns (if you have a sales_return table, add logic here)
      // Aggregate expenses
      let totalExpense = 0;
      for (const exp of expenses) {
        totalExpense += Number(exp.amount || 0);
      }

      // Cash in hand: opening_cash + all cash_in - all cash_out
      let cashInHand = Number(session.opening_cash || 0);
      for (const m of movements) {
        if (m.type === 'cash_in') cashInHand += Number(m.amount || 0);
        if (m.type === 'cash_out') cashInHand -= Number(m.amount || 0);
      }

      // Total cash: cashInHand + totalPayment (if cash payments are not already included)
      let totalCash = cashInHand + paymentBreakdown.cash;

      return res.status(200).json({
        success: true,
        data: {
          session,
          orders,
          orderItems,
          movements,
          expenses,
          totalSales,
          totalPayment,
          paymentBreakdown,
          totalReturn,
          totalExpense,
          cashInHand,
          totalCash,
          productsSold: Object.values(productsSold),
        }
      });
    } catch (error) {
      console.error("Z-report API error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 