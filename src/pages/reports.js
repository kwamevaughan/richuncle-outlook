import React, { useState, useEffect, useRef } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import DateRangePicker from "@/components/DateRangePicker";
import SimpleModal from "@/components/SimpleModal";

// Report Components (to be created)
import SalesReport from "@/components/reports/SalesReport";
import InventoryReport from "@/components/reports/InventoryReport";
import PurchasesReport from "@/components/reports/PurchasesReport";
import CustomersReport from "@/components/reports/CustomersReport";
import SuppliersReport from "@/components/reports/SuppliersReport";
import ProductsReport from "@/components/reports/ProductsReport";
import ExpensesReport from "@/components/reports/ExpensesReport";
import ProfitLossReport from "@/components/reports/ProfitLossReport";
import TaxReport from "@/components/reports/TaxReport";
import AnnualReport from "@/components/reports/AnnualReport";
import ZReportHub from "@/components/reports/ZReportHub";
import PaymentReport from "@/components/reports/PaymentReport";

export default function ReportsPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [tempDateRange, setTempDateRange] = useState(null);
  const [dropdownValue, setDropdownValue] = useState("This Month");
  const dateRangeDropdownRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  // Global filters for all reports
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: startOfMonth, endDate: today, label: "This Month" };
  });
  const [selectedStore, setSelectedStore] = useState("all");
  const [stores, setStores] = useState([]);

  // Fetch stores for filter
  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then(({ data }) => setStores(data || []))
      .catch(err => console.error('Error fetching stores:', err));
  }, []);

  // Tab configuration
  const tabs = [
    {
      id: "sales",
      label: "Sales",
      icon: "mdi:chart-line",
      description: "Sales analytics, trends, and performance",
      color: "blue",
      component: SalesReport
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: "mdi:package-variant",
      description: "Stock levels, movements, and alerts",
      color: "green",
      component: InventoryReport
    },
    {
      id: "purchases",
      label: "Purchases",
      icon: "mdi:cart-outline",
      description: "Purchase orders, direct purchases, and returns",
      color: "purple",
      component: PurchasesReport
    },
    {
      id: "customers",
      label: "Customers",
      icon: "mdi:account-group",
      description: "Customer analytics and due balances",
      color: "indigo",
      component: CustomersReport
    },
    {
      id: "suppliers",
      label: "Suppliers",
      icon: "mdi:truck-delivery",
      description: "Supplier performance and due balances",
      color: "orange",
      component: SuppliersReport
    },
    {
      id: "products",
      label: "Products",
      icon: "mdi:cube-outline",
      description: "Product performance and expiry alerts",
      color: "teal",
      component: ProductsReport
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: "mdi:file-document-outline",
      description: "Expense tracking and analysis",
      color: "red",
      component: ExpensesReport
    },
    {
      id: "payments",
      label: "Payments",
      icon: "mdi:credit-card-multiple",
      description: "Payment methods breakdown and transaction analysis",
      color: "pink",
      component: PaymentReport
    },
    {
      id: "profit-loss",
      label: "Profit & Loss",
      icon: "mdi:chart-areaspline",
      description: "Financial performance and profitability",
      color: "emerald",
      component: ProfitLossReport
    },
    {
      id: "tax",
      label: "Tax",
      icon: "mdi:calculator",
      description: "Tax calculations and reports",
      color: "amber",
      component: TaxReport
    },
    {
      id: "annual",
      label: "Annual",
      icon: "mdi:calendar-year",
      description: "Annual reports and summaries",
      color: "cyan",
      component: AnnualReport
    },
    {
      id: "z-report",
      label: "Z-Report",
      icon: "mdi:receipt-long",
      description: "Register sessions and Z-reports",
      color: "rose",
      component: ZReportHub
    }
  ];

  // Deep-linking: set tab from query param on mount
  useEffect(() => {
    if (router.isReady) {
      const tabParam = router.query.tab;
      if (tabParam && tabs.some(tab => tab.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
    // eslint-disable-next-line
  }, [router.isReady, router.query.tab]);

  // Update URL when tab changes
  useEffect(() => {
    if (router.isReady) {
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, tab: activeTab },
      }, undefined, { shallow: true });
    }
    // eslint-disable-next-line
  }, [activeTab]);

  

  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTab);
  };

  const ActiveComponent = getActiveTab()?.component;

  if (userLoading) return <LoadingComponent />;

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-1">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Icon icon="mdi:chart-bar" className="w-7 h-7 text-white" />
                  </div>
                  Reports Hub
                </h1>
                <p className="text-gray-600">
                  Comprehensive business insights and performance analytics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:menu" className="w-4 h-4" />
                  {showMenu ? "Hide Menu" : "Show Menu"}
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:filter" className="w-4 h-4" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>
            </div>

            {/* Global Filters */}
            {showFilters && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:calendar" className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Date Range:
                    </span>
                    <select
                      ref={dateRangeDropdownRef}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={dropdownValue}
                      onChange={(e) => {
                        setDropdownValue(e.target.value);
                        const today = new Date();
                        let startDate, endDate, label;

                        switch (e.target.value) {
                          case "Today":
                            startDate = endDate = today;
                            label = "Today";
                            break;
                          case "Yesterday":
                            startDate = endDate = new Date(
                              today.getTime() - 24 * 60 * 60 * 1000
                            );
                            label = "Yesterday";
                            break;
                          case "This Week":
                            const startOfWeek = new Date(today);
                            startOfWeek.setDate(
                              today.getDate() - today.getDay()
                            );
                            startDate = startOfWeek;
                            endDate = today;
                            label = "This Week";
                            break;
                          case "Last Week":
                            const lastWeekStart = new Date(today);
                            lastWeekStart.setDate(
                              today.getDate() - today.getDay() - 7
                            );
                            const lastWeekEnd = new Date(lastWeekStart);
                            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
                            startDate = lastWeekStart;
                            endDate = lastWeekEnd;
                            label = "Last Week";
                            break;
                          case "This Month":
                            startDate = new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              1
                            );
                            endDate = today;
                            label = "This Month";
                            break;
                          case "Last Month":
                            startDate = new Date(
                              today.getFullYear(),
                              today.getMonth() - 1,
                              1
                            );
                            endDate = new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              0
                            );
                            label = "Last Month";
                            break;
                          case "This Year":
                            startDate = new Date(today.getFullYear(), 0, 1);
                            endDate = today;
                            label = "This Year";
                            break;
                          default:
                            startDate = endDate = today;
                            label = "Today";
                        }

                        setDateRange({ startDate, endDate, label });
                      }}
                    >
                      <option value="Today">Today</option>
                      <option value="Yesterday">Yesterday</option>
                      <option value="This Week">This Week</option>
                      <option value="Last Week">Last Week</option>
                      <option value="This Month">This Month</option>
                      <option value="Last Month">Last Month</option>
                      <option value="This Year">This Year</option>
                    </select>
                    <button
                      onClick={() => {
                        setTempDateRange(dateRange);
                        setShowDateRangeModal(true);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50 flex items-center gap-2"
                      title="Select Custom Date Range"
                    >
                      <Icon icon="mdi:calendar-range" className="w-4 h-4" />
                      Custom
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:store" className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Store:
                    </span>
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                    >
                      <option value="all">All Stores</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            {showMenu && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? `bg-blue-500 text-white shadow-md`
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon icon={tab.icon} className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tab Indicator (when menu is hidden) */}
            {!showMenu && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon
                      icon={getActiveTab()?.icon}
                      className="w-5 h-5 text-blue-500"
                    />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getActiveTab()?.label}
                    </h2>
                    <span className="text-sm text-gray-500">•</span>
                    <p className="text-sm text-gray-600">
                      {getActiveTab()?.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMenu(true)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Icon icon="mdi:menu" className="w-4 h-4" />
                    Show Menu
                  </button>
                </div>
              </div>
            )}

            {/* Active Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
              {ActiveComponent ? (
                <ActiveComponent
                  dateRange={dateRange}
                  selectedStore={selectedStore}
                  stores={stores}
                  mode={mode}
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Icon
                    icon="mdi:alert-circle"
                    className="w-12 h-12 mx-auto mb-4 text-gray-300"
                  />
                  <p>Report component not found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Modal */}
      <SimpleModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        title="Select Custom Date Range"
        width="max-w-md"
      >
        <div className="space-y-4">
          <DateRangePicker
            value={tempDateRange || dateRange}
            onChange={(newRange) => {
              setTempDateRange(newRange);
            }}
            hideDropdown={true}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setTempDateRange(dateRange);
                setDropdownValue(dateRange.label);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {
                setShowDateRangeModal(false);
                setDropdownValue(dateRange.label);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (tempDateRange) {
                  setDateRange(tempDateRange);
                  setDropdownValue(tempDateRange.label);
                }
                setShowDateRangeModal(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </SimpleModal>
    </MainLayout>
  );
} 