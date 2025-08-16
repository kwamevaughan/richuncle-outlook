import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardStatsGridContainer from "@/components/DashboardStatsGridContainer";
import DateRangePicker from "@/components/DateRangePicker";
import ProfitLossChart from "@/components/ProfitLossChart";
import OverallInfoCard from "@/components/OverallInfoCard";
import CustomersOverviewCard from "@/components/CustomersOverviewCard";
import TopSellingProductsCard from "@/components/TopSellingProductsCard";
import LowStockProductsCard from "@/components/LowStockProductsCard";
import RecentSalesCard from "@/components/RecentSalesCard";
import SalesStaticsCard from "@/components/SalesStaticsCard";
import RecentTransactionsCard from "@/components/RecentTransactionsCard";
import TopCustomersCard from "@/components/TopCustomersCard";
import TopCategoriesCard from "@/components/TopCategoriesCard";
import OrderStatisticsHeatmap from "@/components/OrderStatisticsHeatmap";
import NotificationCarousel from "@/components/NotificationCarousel";
import toast from "react-hot-toast";

// Debounce function to prevent multiple toast messages
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function Dashboard({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();

  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return { startDate: startOfDay, endDate: startOfDay, label: "Today" };
  });

  const [selectedStore, setSelectedStore] = useState("");
  const [stores, setStores] = useState([]);
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false);

  // Fetch stores on mount
  useEffect(() => {
    fetch("/api/stores")
      .then((res) => res.json())
      .then(({ data }) => setStores(data || []));
  }, []);

  // Debounced toast function
  const showStoreToast = debounce((storeId, stores) => {
    if (storeId) {
      const store = stores.find((s) => s.id === storeId);
      if (store) {
        toast.success(`Now viewing dashboard for: ${store.name}`);
      }
    } else {
      toast.success("Now viewing dashboard for: All Stores");
    }
  }, 500);

  // Listen for store selection changes
  useEffect(() => {
    const storeId = localStorage.getItem("selected_store_id") || "";
    setSelectedStore(storeId);

    // Only show toast on initial load if stores are loaded and haven't shown it yet
    if (stores.length > 0 && !hasShownInitialToast) {
      showStoreToast(storeId, stores);
      setHasShownInitialToast(true);
    }

    const handleStorageChange = (e) => {
      if (e.key === "selected_store_id") {
        const newStoreId = e.newValue || "";
        setSelectedStore(newStoreId);
        showStoreToast(newStoreId, stores);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [stores, hasShownInitialToast]);


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
      <div className="flex flex-col justify-center py-4 pt-0 md:pt-20">

        {/* Header Row: Welcome Text on Left, Hello on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Welcome, {user.name}
            </h1>
            <div className="w-full">
              {/* Notification Carousel */}
              <div className="flex justify-start">
                <NotificationCarousel mode={mode} />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        <DashboardStatsGridContainer
          dateRange={dateRange}
          selectedStore={selectedStore}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-4 mb-4">
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow-md">
          <ProfitLossChart selectedStore={selectedStore} />
        </div>
        <div className="w-full md:w-1/3 flex flex-col gap-4 bg-white rounded-lg shadow-md h-full">
          <div className="border-b-2 border-gray-100 pb-4">
            <OverallInfoCard />
          </div>
          <CustomersOverviewCard selectedStore={selectedStore} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <TopSellingProductsCard selectedStore={selectedStore} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <LowStockProductsCard selectedStore={selectedStore} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:col-span-2 lg:col-span-1">
          <RecentSalesCard selectedStore={selectedStore} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <SalesStaticsCard selectedStore={selectedStore} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <RecentTransactionsCard selectedStore={selectedStore} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <TopCustomersCard selectedStore={selectedStore} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <TopCategoriesCard selectedStore={selectedStore} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:col-span-2 lg:col-span-1">
          <OrderStatisticsHeatmap selectedStore={selectedStore} />
        </div>
      </div>
    </MainLayout>
  );
}
