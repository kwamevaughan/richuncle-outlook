import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardStatsGridContainer from "@/components/DashboardStatsGridContainer";
import DateRangePicker from "@/components/DateRangePicker";

export default function Dashboard({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();

  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return { startDate: today, endDate: today, label: "Today" };
  });

  const [orderCount, setOrderCount] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [lowStockProduct, setLowStockProduct] = useState(null);
  const [stockError, setStockError] = useState(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrderError(null);
      try {
        const res = await fetch("/api/orders");
        const result = await res.json();
        if (!result.success)
          throw new Error(result.error || "Failed to fetch orders");
        const { startDate, endDate } = dateRange;
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Normalize end date to end of day
        end.setHours(23, 59, 59, 999);
        const filteredOrders = (result.data || []).filter((order) => {
          if (!order.timestamp) return false;
          const ts = new Date(order.timestamp);
          return ts >= start && ts <= end;
        });
        setOrderCount(filteredOrders.length);
      } catch (err) {
        setOrderError(err.message || "Failed to fetch orders");
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [dateRange]);

  useEffect(() => {
    const fetchLowStock = async () => {
      setStockLoading(true);
      setStockError(null);
      try {
        const res = await fetch("/api/products");
        const result = await res.json();
        if (!result.success)
          throw new Error(result.error || "Failed to fetch products");
        const lowStock = (result.data || []).filter(
          (p) => parseInt(p.quantity) > 0 && parseInt(p.quantity) <= 5
        );
        setLowStockProduct(lowStock.length > 0 ? lowStock[0] : null);
      } catch (err) {
        setStockError(err.message || "Failed to fetch products");
      } finally {
        setStockLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-col justify-center p-">
        {/* Header Row: Welcome Text on Left, Hello on Right */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}</h1>
            <p className="text-sm text-gray-500">
              {ordersLoading ? (
                <span>Loading orders...</span>
              ) : orderError ? (
                <span className="text-red-600">{orderError}</span>
              ) : (
                <>
                  You have{" "}
                  <span className="font-bold text-blue-800">{orderCount}{orderCount > 0 ? "+" : ""}</span>{" "}
                  Orders, Today.
                </>
              )}
            </p>
          </div>

          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        {/* Low Stock Notification Box */}
        {showLowStock && (
          <div className="flex items-center justify-between mt-4 bg-orange-100 p-2 rounded-md">
            <p className="text-sm text-gray-500 flex gap-2">
              {stockLoading ? (
                <span>Loading stock info...</span>
              ) : stockError ? (
                <span className="text-red-600">{stockError}</span>
              ) : lowStockProduct ? (
                <>
                  Your Product{" "}
                  <span className="font-bold text-blue-900">
                    {lowStockProduct.name}
                  </span>{" "}
                  is running Low, already below {lowStockProduct.quantity} Pcs.
                  <button
                    className="text-blue-900 font-bold underline"
                    onClick={() =>
                      router.push(
                        `/manage-stock?quickUpdateId=${lowStockProduct.id}`
                      )
                    }
                  >
                    Add Stock
                  </button>
                </>
              ) : (
                <span>All products are sufficiently stocked.</span>
              )}
            </p>
            <button
              className="flex items-center justify-end cursor-pointer"
              onClick={() => setShowLowStock(false)}
              aria-label="Close notification"
            >
              <Icon
                icon="iconamoon:close"
                className="text-2xl text-gray-500 hover:text-gray-700"
              />
            </button>
          </div>
        )}
      </div>

      <DashboardStatsGridContainer dateRange={dateRange} />
    </MainLayout>
  );
}
