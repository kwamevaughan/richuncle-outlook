import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  if (req.method === "PUT") {
    try {
      // Get closing_cash from request
      const closing_cash = req.body.closing_cash;
      // Set closed_at to now if not provided
      const closed_at = req.body.closed_at || new Date().toISOString();

      // Fetch the session to get opening_cash and register_id
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("cash_register_sessions")
        .select("*")
        .eq("id", id)
        .single();
      if (sessionError || !session) throw sessionError || new Error("Session not found");

      // Fetch all cash movements for this session
      const { data: movements, error: movementsError } = await supabaseAdmin
        .from("cash_movements")
        .select("*")
        .eq("session_id", id);
      if (movementsError) throw movementsError;

      // Fetch all orders for this register during the session
      let ordersQuery = supabaseAdmin
        .from("orders")
        .select("*", { count: "exact" })
        .eq("register_id", session.register_id);
      if (session.opened_at) ordersQuery = ordersQuery.gte("timestamp", session.opened_at);
      if (closed_at) ordersQuery = ordersQuery.lte("timestamp", closed_at);
      const { data: orders, error: ordersError } = await ordersQuery.order("timestamp", { ascending: true });
      if (ordersError) throw ordersError;
      // Calculate total sales and refunds
      let totalSales = 0;
      let totalRefund = 0;
      for (const order of orders) {
        if (order.status === 'Refunded' || order.status === 'refunded') {
          totalRefund += Number(order.total) || 0;
        } else {
          totalSales += Number(order.total) || 0;
        }
      }

      // Fetch all expenses for this session
      let expenses = [];
      if (session.opened_at && closed_at) {
        const { data: exp, error: expError } = await supabaseAdmin
          .from("expenses")
          .select("*")
          .eq("register_id", session.register_id)
          .gte("expense_date", session.opened_at)
          .lte("expense_date", closed_at);
        if (!expError) expenses = exp;
      }

      // Calculate expected_cash: opening_cash + totalSales + all cash_in - all cash_out - refunds - expenses
      let expected_cash = Number(session.opening_cash || 0) + totalSales;
      for (const m of movements) {
        if (m.type === 'cash_in') expected_cash += Number(m.amount || 0);
        if (m.type === 'cash_out') expected_cash -= Number(m.amount || 0);
      }
      // Subtract refunds
      expected_cash -= totalRefund;
      // Subtract expenses
      for (const exp of expenses) {
        expected_cash -= Number(exp.amount || 0);
      }

      // Calculate over_short
      let over_short = null;
      if (typeof closing_cash === 'number' && !isNaN(closing_cash)) {
        over_short = closing_cash - expected_cash;
      }

      // Update session with closed_at, expected_cash, over_short
      const { data, error } = await supabaseAdmin
        .from("cash_register_sessions")
        .update({
          ...req.body,
          closed_at,
          expected_cash,
          over_short,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Update cash register session error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { error } = await supabaseAdmin
        .from("cash_register_sessions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Delete cash register session error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 