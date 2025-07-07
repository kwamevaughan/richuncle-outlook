import { useEffect, useState } from "react";
import DashboardStatsGrid from "./DashboardStatsGrid";
import { differenceInCalendarDays, subDays } from "date-fns";

function formatCurrency(amount) {
  return "GHS " + Number(amount).toLocaleString();
}

function isWithinRange(date, start, end) {
  const d = new Date(date);
  return d >= start && d <= end;
}

function calcChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export default function DashboardStatsGridContainer({ dateRange }) {
  const [stats, setStats] = useState([
    { label: "Total Sales", value: "...", icon: "mdi:file-document-outline", color: "sales", change: "+0%", changeType: "up" },
    { label: "Total Sales Return", value: "...", icon: "mdi:swap-horizontal", color: "salesReturn", change: "0%", changeType: "down" },
    { label: "Total Purchase", value: "...", icon: "mdi:gift-outline", color: "purchase", change: "+0%", changeType: "up" },
    { label: "Total Purchase Return", value: "...", icon: "mdi:shield-check-outline", color: "purchaseReturn", change: "+0%", changeType: "up" },
  ]);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, purchasesRes, purchaseReturnsRes, salesReturnsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/purchases"),
        fetch("/api/purchase-returns"),
        fetch("/api/sales-returns"),
      ]);
      const [orders, purchases, purchaseReturns, salesReturns] = await Promise.all([
        ordersRes.json(),
        purchasesRes.json(),
        purchaseReturnsRes.json(),
        salesReturnsRes.json(),
      ]);

      // Date range filtering
      const { startDate, endDate } = dateRange || {};
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      const rangeDays = differenceInCalendarDays(end, start) + 1;

      // Comparison range: same length, ending yesterday
      const compEnd = subDays(new Date(), 1);
      compEnd.setHours(23, 59, 59, 999);
      const compStart = subDays(compEnd, rangeDays - 1);
      compStart.setHours(0, 0, 0, 0);

      // Orders: filter by timestamp
      const filteredOrders = (orders.data || []).filter(o => o.timestamp && isWithinRange(o.timestamp, start, end));
      const totalSales = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const compOrders = (orders.data || []).filter(o => o.timestamp && isWithinRange(o.timestamp, compStart, compEnd));
      const compTotalSales = compOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

      // Sales Returns: filter by date
      const filteredSalesReturns = (salesReturns.data || []).filter(r => r.date && isWithinRange(r.date, start, end));
      const totalSalesReturn = filteredSalesReturns.reduce((sum, r) => sum + Number(r.total || 0), 0);
      const compSalesReturns = (salesReturns.data || []).filter(r => r.date && isWithinRange(r.date, compStart, compEnd));
      const compTotalSalesReturn = compSalesReturns.reduce((sum, r) => sum + Number(r.total || 0), 0);

      // Purchases: filter by date
      const filteredPurchases = (purchases.data || []).filter(p => p.date && isWithinRange(p.date, start, end));
      const totalPurchase = filteredPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
      const compPurchases = (purchases.data || []).filter(p => p.date && isWithinRange(p.date, compStart, compEnd));
      const compTotalPurchase = compPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

      // Purchase Returns: filter by date
      const filteredPurchaseReturns = (purchaseReturns.data || []).filter(r => r.date && isWithinRange(r.date, start, end));
      const totalPurchaseReturn = filteredPurchaseReturns.reduce((sum, r) => sum + Number(r.total || 0), 0);
      const compPurchaseReturns = (purchaseReturns.data || []).filter(r => r.date && isWithinRange(r.date, compStart, compEnd));
      const compTotalPurchaseReturn = compPurchaseReturns.reduce((sum, r) => sum + Number(r.total || 0), 0);

      // Calculate percentage changes
      const salesChange = calcChange(totalSales, compTotalSales);
      const salesReturnChange = calcChange(totalSalesReturn, compTotalSalesReturn);
      const purchaseChange = calcChange(totalPurchase, compTotalPurchase);
      const purchaseReturnChange = calcChange(totalPurchaseReturn, compTotalPurchaseReturn);

      setStats([
        {
          label: "Total Sales",
          value: formatCurrency(totalSales),
          icon: "mdi:file-document-outline",
          color: "sales",
          change: `${salesChange > 0 ? "+" : ""}${salesChange.toFixed(1)}%`,
          changeType: salesChange >= 0 ? "up" : "down",
        },
        {
          label: "Total Sales Return",
          value: formatCurrency(totalSalesReturn),
          icon: "mdi:swap-horizontal",
          color: "salesReturn",
          change: `${salesReturnChange > 0 ? "+" : ""}${salesReturnChange.toFixed(1)}%`,
          changeType: salesReturnChange >= 0 ? "up" : "down",
        },
        {
          label: "Total Purchase",
          value: formatCurrency(totalPurchase),
          icon: "mdi:gift-outline",
          color: "purchase",
          change: `${purchaseChange > 0 ? "+" : ""}${purchaseChange.toFixed(1)}%`,
          changeType: purchaseChange >= 0 ? "up" : "down",
        },
        {
          label: "Total Purchase Return",
          value: formatCurrency(totalPurchaseReturn),
          icon: "mdi:shield-check-outline",
          color: "purchaseReturn",
          change: `${purchaseReturnChange > 0 ? "+" : ""}${purchaseReturnChange.toFixed(1)}%`,
          changeType: purchaseReturnChange >= 0 ? "up" : "down",
        },
      ]);
    }
    fetchStats();
  }, [dateRange]);

  return <DashboardStatsGrid stats={stats} />;
} 