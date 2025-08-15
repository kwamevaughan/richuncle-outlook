import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { GenericTable } from "../GenericTable";
import ExportModal from "../export/ExportModal";

export default function ZReportHub({ dateRange, selectedStore, stores, mode }) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchSessionsData();
  }, [dateRange, selectedStore]);

  // Fetch sessions data function
  const fetchSessionsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch cash register sessions
      const sessionsRes = await fetch("/api/cash-register-sessions");
      const sessionsJson = await sessionsRes.json();
      let sessionsData = sessionsJson.data || [];
      
      // Filter by date and store
      if (dateRange.startDate && dateRange.endDate) {
        sessionsData = sessionsData.filter(session => {
          const sessionDate = new Date(session.opened_at);
          return sessionDate >= dateRange.startDate && sessionDate <= dateRange.endDate;
        });
      }
      if (selectedStore && selectedStore !== "all") {
        sessionsData = sessionsData.filter(session => String(session.register_id) === String(selectedStore));
      }

      // Fetch orders for each session to calculate totals
      const ordersRes = await fetch("/api/orders");
      const ordersJson = await ordersRes.json();
      const orders = ordersJson.data || [];

      // Fetch order items to calculate total items
      const orderItemsRes = await fetch("/api/order-items");
      const orderItemsJson = await orderItemsRes.json();
      const orderItems = orderItemsJson.data || [];

      // Enhance sessions with order data
      const enhancedSessions = sessionsData.map(session => {
        // Use the same logic as the individual Z-Report API:
        // Filter orders by register_id and timestamp range
        const sessionOrders = orders.filter(order => {
          // Match register_id
          if (String(order.register_id) !== String(session.register_id)) {
            return false;
          }
          
          // Match timestamp range (opened_at to closed_at or now)
          const orderTime = new Date(order.timestamp || order.created_at);
          const openedTime = new Date(session.opened_at);
          const closedTime = session.closed_at ? new Date(session.closed_at) : new Date();
          
          return orderTime >= openedTime && orderTime <= closedTime;
        });
        
        // Get order IDs for this session
        const sessionOrderIds = sessionOrders.map(order => order.id);
        
        // Calculate total items from order items
        const sessionOrderItems = orderItems.filter(item => 
          sessionOrderIds.includes(item.order_id)
        );
        const totalItems = sessionOrderItems.reduce((sum, item) => 
          sum + (parseInt(item.quantity) || 0), 0
        );
        
        const totalSales = sessionOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        
        return {
          ...session,
          totalSales,
          totalItems,
          orderCount: sessionOrders.length,
          duration: session.closed_at ? 
            (new Date(session.closed_at) - new Date(session.opened_at)) : 
            null, // milliseconds
          status: session.closed_at ? "closed" : "open" // Add computed status field
        };
      });

      setSessions(enhancedSessions);
    } catch (err) {
      setError("Failed to load Z-Report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch users for mapping user_id to name
    fetch("/api/users")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach(u => { map[u.id] = u.full_name || u.email || u.id; });
          setUserMap(map);
        }
      });
  }, []);

  // Helper function to format duration in a readable format
  const formatDuration = (durationMs) => {
    if (!durationMs || durationMs <= 0) return "0m";
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  // KPI calculations
  const totalSessions = sessions.length;
  const openSessions = sessions.filter(s => !s.closed_at).length;
  const totalSales = sessions.reduce((sum, s) => sum + s.totalSales, 0);
  const totalItems = sessions.reduce((sum, s) => sum + s.totalItems, 0);

  // Define columns for GenericTable
  const columns = [
    { Header: "Session ID", accessor: "id" },
    { Header: "Opened", accessor: "opened_at", render: (row) => format(new Date(row.opened_at), "MMM dd, yyyy HH:mm") },
    { Header: "Closed", accessor: "closed_at", render: (row) => row.closed_at ? format(new Date(row.closed_at), "MMM dd, yyyy HH:mm") : "Open" },
    { Header: "Duration", accessor: "duration", render: (row) => {
      if (row.duration === null) return "N/A";
      return formatDuration(row.duration);
    } },
    { Header: "Orders", accessor: "orderCount" },
    { Header: "Sales", accessor: "totalSales", render: (row) => `GHS ${row.totalSales.toLocaleString()}` },
    { Header: "Items", accessor: "totalItems" },
    { Header: "Status", accessor: "status" },
  ];

  // When preparing export data, replace user_id with name and remove user_id field
  const exportSessions = sessions.map(s => {
    const { user_id, ...rest } = s;
    return {
      id: s.id,
      opened_by: userMap[s.user_id] || s.user_id,
      opened_at: s.opened_at,
      closed_at: s.closed_at,
      opening_cash: s.opening_cash ? parseFloat(s.opening_cash).toLocaleString() : '0',
      closing_cash: s.closing_cash ? parseFloat(s.closing_cash).toLocaleString() : '0',
      expected_cash: s.expected_cash ? parseFloat(s.expected_cash).toLocaleString() : '0',
      over_short: s.over_short ? parseFloat(s.over_short).toLocaleString() : '0',
      status: s.status,
      register_id: s.register_id,
      close_note: s.close_note,
      force: s.force,
      totalSales: s.totalSales.toLocaleString(),
      totalItems: s.totalItems,
      orderCount: s.orderCount,
      duration: formatDuration(s.duration),
    };
  });

  // Custom field mappings for export
  const getFieldsOrder = () => [
    { label: "Session ID", key: "id", icon: "mdi:identifier" },
    { label: "Opened By", key: "opened_by", icon: "mdi:account" },
    { label: "Opened At", key: "opened_at", icon: "mdi:clock" },
    { label: "Closed At", key: "closed_at", icon: "mdi:clock-check" },
    { label: "Opening Cash", key: "opening_cash", icon: "mdi:cash" },
    { label: "Closing Cash", key: "closing_cash", icon: "mdi:cash-multiple" },
    { label: "Expected Cash", key: "expected_cash", icon: "mdi:cash-register" },
    { label: "Over Short", key: "over_short", icon: "mdi:calculator" },
    { label: "Status", key: "status", icon: "mdi:check-circle" },
    { label: "Register ID", key: "register_id", icon: "mdi:cash-register" },
    { label: "Close Note", key: "close_note", icon: "mdi:note-text" },
    { label: "Force", key: "force", icon: "mdi:alert" },
    { label: "Total Sales", key: "totalSales", icon: "mdi:currency-usd" },
    { label: "Total Items", key: "totalItems", icon: "mdi:package-variant" },
    { label: "Order Count", key: "orderCount", icon: "mdi:clipboard-text" },
    { label: "Duration (Hours & Minutes)", key: "duration", icon: "mdi:clock-outline" },
  ];

  const getDefaultFields = () => ({
    id: true,
    opened_by: true,
    opened_at: true,
    closed_at: true,
    opening_cash: true,
    closing_cash: true,
    expected_cash: true,
    over_short: true,
    status: true,
    register_id: false, // Hide by default
    close_note: true,
    force: false, // Hide by default
    totalSales: true,
    totalItems: true,
    orderCount: true,
    duration: true,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Z-Report (Register Sessions)</h2>
        <p className="text-gray-600">
          Register sessions and Z-reports for {dateRange.label}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Total Sessions</p>
              <p className="text-3xl font-bold">{loading ? '...' : totalSessions}</p>
            </div>
            <Icon icon="mdi:receipt-long" className="w-8 h-8 text-rose-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Open Sessions</p>
              <p className="text-3xl font-bold">{loading ? '...' : openSessions}</p>
            </div>
            <Icon icon="mdi:play-circle" className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Sales</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${totalSales.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:cash-register" className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Items</p>
              <p className="text-3xl font-bold">{loading ? '...' : totalItems}</p>
            </div>
            <Icon icon="mdi:package-variant" className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>
      <div className="">
        <div className="text-center text-gray-700">
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : loading ? (
            <div>Loading...</div>
          ) : (
            <GenericTable
              data={sessions}
              columns={columns}
              loading={loading}
              error={error}
              onRefresh={fetchSessionsData}
              enableStatusPills={true}
              statusContext="default"
              statusPillSize="sm"
              customStatusContexts={{
                'status': 'session'
              }}
              exportType="z-report"
              exportTitle="Export Z-Report"
              getFieldsOrder={getFieldsOrder}
              getDefaultFields={getDefaultFields}
            />
          )}
        </div>
      </div>
      {/* Export Modal */}
      <ExportModal
        key={`zreport-export-${sessions.length}`}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        users={exportSessions}
        mode={mode}
        type="zreport"
        title="Export Register Sessions"
        getFieldsOrder={getFieldsOrder}
        getDefaultFields={getDefaultFields}
      />
    </div>
  );
} 