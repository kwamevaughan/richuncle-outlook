import { useEffect, useState } from "react";
import DashboardStatsGrid from "./DashboardStatsGrid";

function formatCurrency(amount) {
  return "$" + Number(amount).toLocaleString();
}

export default function DashboardStatsGridContainer() {
  const [stats, setStats] = useState([
    { label: "Total Sales", value: "...", icon: "mdi:file-document-outline", color: "sales", change: "+0%", changeType: "up" },
    { label: "Total Sales Return", value: "...", icon: "mdi:swap-horizontal", color: "salesReturn", change: "0%", changeType: "down" },
    { label: "Total Purchase", value: "...", icon: "mdi:gift-outline", color: "purchase", change: "+0%", changeType: "up" },
    { label: "Total Purchase Return", value: "...", icon: "mdi:shield-check-outline", color: "purchaseReturn", change: "+0%", changeType: "up" },
  ]);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, purchasesRes, purchaseReturnsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/purchases"),
        fetch("/api/purchase-returns"),
      ]);
      const [orders, purchases, purchaseReturns] = await Promise.all([
        ordersRes.json(),
        purchasesRes.json(),
        purchaseReturnsRes.json(),
      ]);

      const totalSales = (orders.data || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
      // TODO: Replace with real sales return data if available
      const totalSalesReturn = 0;
      const totalPurchase = (purchases.data || []).reduce((sum, p) => sum + Number(p.total || 0), 0);
      const totalPurchaseReturn = (purchaseReturns.data || []).reduce((sum, r) => sum + Number(r.total || 0), 0);

      setStats([
        { label: "Total Sales", value: formatCurrency(totalSales), icon: "mdi:file-document-outline", color: "sales", change: "+0%", changeType: "up" },
        { label: "Total Sales Return", value: formatCurrency(totalSalesReturn), icon: "mdi:swap-horizontal", color: "salesReturn", change: "0%", changeType: "down" },
        { label: "Total Purchase", value: formatCurrency(totalPurchase), icon: "mdi:gift-outline", color: "purchase", change: "+0%", changeType: "up" },
        { label: "Total Purchase Return", value: formatCurrency(totalPurchaseReturn), icon: "mdi:shield-check-outline", color: "purchaseReturn", change: "+0%", changeType: "up" },
      ]);
    }
    fetchStats();
  }, []);

  return <DashboardStatsGrid stats={stats} />;
} 