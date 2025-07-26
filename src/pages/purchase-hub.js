import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import usePurchases from "../hooks/usePurchases";
import usePurchaseOrders from "../hooks/usePurchaseOrders";
import usePurchaseReturns from "../hooks/usePurchaseReturns";
import { GenericTable } from "../components/GenericTable";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";

export default function PurchaseHubPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  
  // Hooks for different purchase types
  const {
    purchases,
    loading: purchasesLoading,
    error: purchasesError,
    fetchPurchases,
  } = usePurchases();
  
  const {
    purchaseOrders,
    loading: ordersLoading,
    error: ordersError,
    fetchPurchaseOrders,
  } = usePurchaseOrders();
  
  const {
    purchaseReturns,
    loading: returnsLoading,
    error: returnsError,
    fetchPurchaseReturns,
  } = usePurchaseReturns();

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalPurchases: 0,
    totalReturns: 0,
    pendingReturns: 0,
    totalSpent: 0,
    monthlySpent: 0,
    supplierCount: 0
  });
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [supplierFilter, setSupplierFilter] = useState("all");
  
  // Modal states
  const [showQuickPurchaseModal, setShowQuickPurchaseModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPurchases(),
          fetchPurchaseOrders(),
          fetchPurchaseReturns()
        ]);
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [fetchPurchases, fetchPurchaseOrders, fetchPurchaseReturns]);

  // Calculate statistics
  useEffect(() => {
    if (!loading) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const totalOrders = purchaseOrders.length;
      const pendingOrders = purchaseOrders.filter(order => 
        ['pending', 'approved', 'in_transit'].includes(order.status)
      ).length;
      
      const totalPurchases = purchases.length;
      const totalReturns = purchaseReturns.length;
      const pendingReturns = purchaseReturns.filter(ret => 
        ['pending', 'approved'].includes(ret.status)
      ).length;
      
      const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
      const monthlySpent = purchases
        .filter(purchase => new Date(purchase.date) >= thirtyDaysAgo)
        .reduce((sum, purchase) => sum + (purchase.total || 0), 0);
      
      // Get unique suppliers
      const allSuppliers = new Set([
        ...purchases.map(p => p.supplier_id),
        ...purchaseOrders.map(o => o.supplier_id),
        ...purchaseReturns.map(r => r.supplier_id)
      ]);
      
      setStats({
        totalOrders,
        pendingOrders,
        totalPurchases,
        totalReturns,
        pendingReturns,
        totalSpent,
        monthlySpent,
        supplierCount: allSuppliers.size
      });
    }
  }, [purchases, purchaseOrders, purchaseReturns, loading]);

  // Filter data based on current tab and filters
  const getFilteredData = () => {
    let data = [];
    
    switch (activeTab) {
      case "orders":
        data = purchaseOrders;
        break;
      case "purchases":
        data = purchases;
        break;
      case "returns":
        data = purchaseReturns;
        break;
      default:
        return [];
    }
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => 
        item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.purchase_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.return_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      data = data.filter(item => item.status === statusFilter);
    }
    
    return data;
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", color: "text-yellow-800", icon: "mdi:clock-outline" };
      case "approved":
        return { bg: "bg-blue-100", color: "text-blue-800", icon: "mdi:check-circle" };
      case "in_transit":
        return { bg: "bg-purple-100", color: "text-purple-800", icon: "mdi:truck-delivery" };
      case "completed":
        return { bg: "bg-green-100", color: "text-green-800", icon: "mdi:check-circle" };
      case "cancelled":
        return { bg: "bg-red-100", color: "text-red-800", icon: "mdi:close-circle" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-800", icon: "mdi:help-circle" };
    }
  };

  // Table columns configuration
  const getColumns = () => {
    const baseColumns = [
      { header: "Number", accessor: "order_number", sortable: true, render: (row) => 
        row.order_number || row.purchase_number || row.return_number 
      },
      { header: "Supplier", accessor: "supplier_name", sortable: true },
      { header: "Warehouse", accessor: "warehouse_name", sortable: true },
      { header: "Date", accessor: "date", sortable: true, render: (row) => 
        new Date(row.date).toLocaleDateString() 
      },
      { 
        header: "Status", 
        accessor: "status", 
        sortable: true, 
        render: (row) => {
          const style = getStatusStyle(row.status);
          return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>
              <Icon icon={style.icon} className="w-3 h-3" />
              {row.status.replace('_', ' ').charAt(0).toUpperCase() + row.status.slice(1).replace('_', ' ')}
            </div>
          );
        }
      },
      { header: "Total", accessor: "total", sortable: true, render: (row) => 
        `GHS ${(row.total || 0).toLocaleString()}` 
      },
    ];
    
    return baseColumns;
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout mode={mode} user={user} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
      <div className="flex flex-1 bg-gray-50 min-h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Icon
                        icon="mdi:cart-multiple"
                        className="w-7 h-7 text-white"
                      />
                    </div>
                    Purchase Management Hub
                  </h1>
                  <p className="text-gray-600">
                    Centralized procurement, ordering, and returns management
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const fetchAllData = async () => {
                        setLoading(true);
                        try {
                          await Promise.all([
                            fetchPurchases(),
                            fetchPurchaseOrders(),
                            fetchPurchaseReturns()
                          ]);
                          toast.success("Data refreshed successfully");
                        } catch (error) {
                          toast.error("Failed to refresh data");
                        } finally {
                          setLoading(false);
                        }
                      };
                      fetchAllData();
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Icon icon="mdi:refresh" className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowCreateOrderModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    New Order
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:clipboard-text"
                        className="w-6 h-6 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Orders
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {stats.pendingOrders} pending
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:cart-check"
                        className="w-6 h-6 text-green-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.totalPurchases}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Purchases
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        GHS {stats.totalSpent.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:undo-variant"
                        className="w-6 h-6 text-red-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.totalReturns}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Returns
                      </div>
                      <div className="text-xs text-red-600 font-medium">
                        {stats.pendingReturns} pending
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:account-group"
                        className="w-6 h-6 text-purple-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.supplierCount}
                      </div>
                      <div className="text-sm text-gray-500">
                        Active Suppliers
                      </div>
                      <div className="text-xs text-purple-600 font-medium">
                        GHS {stats.monthlySpent.toLocaleString()} this month
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`${
                      activeTab === "overview"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon icon="mdi:view-dashboard" className="w-5 h-5" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`${
                      activeTab === "orders"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon icon="mdi:clipboard-text" className="w-5 h-5" />
                    Purchase Orders
                    {stats.pendingOrders > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {stats.pendingOrders}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("purchases")}
                    className={`${
                      activeTab === "purchases"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon icon="mdi:cart-check" className="w-5 h-5" />
                    Direct Purchases
                  </button>
                  <button
                    onClick={() => setActiveTab("returns")}
                    className={`${
                      activeTab === "returns"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon icon="mdi:undo-variant" className="w-5 h-5" />
                    Returns
                    {stats.pendingReturns > 0 && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        {stats.pendingReturns}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Filters */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Search by number, supplier, or warehouse..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="in_transit">In Transit</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading purchase data...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {activeTab === "overview" ? (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {/* Recent Orders */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Purchase Orders</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {purchaseOrders.slice(0, 3).map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                              <div>
                                <div className="font-medium text-sm">{order.order_number}</div>
                                <div className="text-xs text-gray-500">{order.supplier_name}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">GHS {order.total?.toLocaleString()}</div>
                                <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusStyle(order.status).bg} ${getStatusStyle(order.status).color}`}>
                                  {order.status}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recent Purchases */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Direct Purchases</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {purchases.slice(0, 3).map((purchase) => (
                            <div key={purchase.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                              <div>
                                <div className="font-medium text-sm">{purchase.purchase_number}</div>
                                <div className="text-xs text-gray-500">{purchase.supplier_name}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">GHS {purchase.total?.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">{new Date(purchase.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <GenericTable
                    data={getFilteredData()}
                    columns={getColumns()}
                    title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    emptyMessage={`No ${activeTab} found`}
                    selectable={false}
                    searchable={false}
                    onAddNew={() => {
                      switch (activeTab) {
                        case "orders":
                          setShowCreateOrderModal(true);
                          break;
                        case "purchases":
                          setShowQuickPurchaseModal(true);
                          break;
                        case "returns":
                          setShowReturnModal(true);
                          break;
                      }
                    }}
                    addNewLabel={`Add ${activeTab.slice(0, -1)}`}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Modal */}
      <SimpleModal
        isOpen={showQuickPurchaseModal}
        onClose={() => setShowQuickPurchaseModal(false)}
        title="Quick Purchase"
        width="max-w-2xl"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Create a quick direct purchase for immediate inventory needs.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowQuickPurchaseModal(false);
                window.location.href = "/purchases";
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Purchases
            </button>
            <button
              onClick={() => setShowQuickPurchaseModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Create Order Modal */}
      <SimpleModal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        title="Create Purchase Order"
        width="max-w-2xl"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Create a formal purchase order with approval workflow.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCreateOrderModal(false);
                window.location.href = "/purchase-order";
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Purchase Orders
            </button>
            <button
              onClick={() => setShowCreateOrderModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Return Modal */}
      <SimpleModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Create Purchase Return"
        width="max-w-2xl"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Create a return for defective or damaged items.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowReturnModal(false);
                window.location.href = "/purchase-return";
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Purchase Returns
            </button>
            <button
              onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </SimpleModal>
    </MainLayout>
  );
} 