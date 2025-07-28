import { useState, useEffect, useRef } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import { useModal } from "./ModalContext";
import TooltipIconButton from "./TooltipIconButton";
import SalesSummary from "./SalesSummary";
import MovementLog from "./MovementLog";
import CashInForm from "./CashInForm";
import CashOutForm from "./CashOutForm";
import CashCountSection from "./CashCountSection";
import AddRegisterForm from "./AddRegisterForm";
import RegisterSelector from "./RegisterSelector";
import ExportModal from "./export/ExportModal";
import ZReportView from "@/components/ZReportView";

const allowedRoles = ["cashier", "manager", "admin"];

const CashRegisterModal = ({ isOpen, onClose, user, onSessionChanged, selectedRegister, setSelectedRegister, setCurrentSessionId, registers = [], setRegisters }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [openAmount, setOpenAmount] = useState();
  const [closeAmount, setCloseAmount] = useState();
  const [cashInAmount, setCashInAmount] = useState();
  const [cashInReason, setCashInReason] = useState("");
  const [cashOutAmount, setCashOutAmount] = useState();
  const [cashOutReason, setCashOutReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showLargeOutConfirm, setShowLargeOutConfirm] = useState(false);
  const [zReport, setZReport] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [closeNote, setCloseNote] = useState("");
  const { showGlobalConfirm } = useModal();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('products');

  // New state for progressive disclosure
  const [showHistory, setShowHistory] = useState(false);
  const [showQuickCashIn, setShowQuickCashIn] = useState(false);
  const [showQuickCashOut, setShowQuickCashOut] = useState(false);

  // Permissions check and filter registers for cashiers
  const canOperate = user && allowedRoles.includes(user.role);
  let filteredRegisters = registers;
  if (user?.role === 'cashier' && user?.store_id) {
    filteredRegisters = registers.filter(r => r.store_id === user.store_id);
  }

  // Auto-select the register for the cashier's store
  useEffect(() => {
    if (user?.role === 'cashier' && user?.store_id && filteredRegisters.length > 0) {
      setSelectedRegister(filteredRegisters[0].id);
    }
  }, [user, filteredRegisters]);

  // Fetch current open session for selected register
  useEffect(() => {
    console.log('[CashRegisterModal] selectedRegister changed:', selectedRegister);
    if (!isOpen || !selectedRegister) return;
    setLoading(true);
    console.log('[CashRegisterModal] Fetching session for register:', selectedRegister);
    (async () => {
      try {
        const sessionsResponse = await fetch(
          `/api/cash-register-sessions?register_id=${selectedRegister}&status=open`
        );
        const sessionsData = await sessionsResponse.json();
        console.log('[CashRegisterModal] Session fetch result:', sessionsData);
        if (sessionsData.success) {
          const currentSession = sessionsData.data && sessionsData.data[0];
          setSession(currentSession || null);
          if (setCurrentSessionId) setCurrentSessionId(currentSession ? currentSession.id : null);
        } else {
          setSession(null);
          if (setCurrentSessionId) setCurrentSessionId(null);
        }
      } catch (err) {
        console.error("Failed to fetch session data:", err);
        setSession(null);
        if (setCurrentSessionId) setCurrentSessionId(null);
      }
      setLoading(false);
      console.log('[CashRegisterModal] Loading set to false');
    })();
  }, [isOpen, selectedRegister]);

  // Fetch movements for the current session
  useEffect(() => {
    if (!session) {
      setMovements([]);
      return;
    }
    (async () => {
      try {
        const movementsResponse = await fetch(
          `/api/cash-movements?session_id=${session.id}`
        );
        const movementsData = await movementsResponse.json();
        if (movementsData.success) {
          setMovements(movementsData.data || []);
        } else {
          setMovements([]);
        }
      } catch (err) {
        console.error("Failed to fetch movements:", err);
        setMovements([]);
      }
    })();
  }, [session, actionLoading]);

  // Fetch user names for movements
  useEffect(() => {
    if (!movements.length) return;
    const uniqueUserIds = Array.from(
      new Set(movements.map((m) => m.user_id).filter(Boolean))
    );
    if (!uniqueUserIds.length) return;

    (async () => {
      try {
        const response = await fetch("/api/users");
        const result = await response.json();
        if (result.success) {
          const map = {};
          (result.data || []).forEach((u) => {
            if (uniqueUserIds.includes(u.id)) {
              map[u.id] = u.full_name || u.id;
            }
          });
          setUserMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    })();
  }, [movements]);

  // Fetch sales/orders for the current session
  const [salesSummary, setSalesSummary] = useState(null);
  useEffect(() => {
    if (!session) {
      setSalesSummary(null);
      return;
    }
    (async () => {
      try {
        // Fetch sales/orders for this session
        const res = await fetch(`/api/orders?register_id=${selectedRegister}&session_id=${session.id}`);
        const result = await res.json();
        if (result.success) {
          const orders = result.data || [];
          // Aggregate by payment method
          const paymentBreakdown = {};
          let totalSales = 0, totalRefund = 0, totalExpense = 0, totalPayment = 0;
          let productsSold = [];
          // Collect all order IDs
          const orderIds = orders.map(order => order.id);
          let allOrderItems = [];
          if (orderIds.length > 0) {
            // Fetch all order items for these orders (in parallel)
            const itemsResults = await Promise.all(orderIds.map(orderId => fetch(`/api/order-items?order_id=${orderId}`).then(r => r.json())));
            allOrderItems = itemsResults.flatMap(r => (r.success && Array.isArray(r.data)) ? r.data : []);
          }
          // Aggregate products from allOrderItems
          allOrderItems.forEach(item => {
            const existing = productsSold.find(p => p.id === item.product_id);
            if (existing) {
              existing.quantity += item.quantity;
              existing.total += item.total;
            } else {
              productsSold.push({
                id: item.product_id,
                name: item.name,
                quantity: item.quantity,
                total: item.total
              });
            }
          });
          // Streamlined payment breakdown: sum all cash, momo, card, other (including split)
          const paymentTypes = ['cash', 'momo', 'card'];
          orders.forEach(order => {
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
          });
          setSalesSummary({
            paymentBreakdown,
            totalSales,
            totalRefund,
            totalExpense,
            totalPayment,
            productsSold
          });
        } else {
          setSalesSummary(null);
        }
      } catch (err) {
        setSalesSummary(null);
      }
    })();
  }, [session, selectedRegister, actionLoading]);

  // Timer for live session duration
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Live session info
  let sessionDuration = 0,
    sessionDurationSeconds = 0;
  if (session) {
    const ms = now - new Date(session.opened_at).getTime();
    sessionDuration = Math.floor(ms / 60000); // minutes
    sessionDurationSeconds = Math.floor((ms % 60000) / 1000); // seconds
  }

  // Calculate current cash
  const currentCash = session ? 
    Number(session.opening_cash) + 
    movements.reduce((sum, m) => sum + (m.type === "cash_in" ? m.amount : -m.amount), 0) : 0;

  // Open register
  const handleOpenRegister = async () => {
    if (!canOperate || !selectedRegister) return;
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cash-register-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          opening_cash: openAmount,
          status: "open",
          register_id: selectedRegister,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSession(result.data);
        setSalesSummary(null); // Reset sales summary for new session
        setOpenAmount(0);
        if (onSessionChanged) await onSessionChanged();
        // Call again after 500ms to ensure backend state is synced
        if (onSessionChanged) setTimeout(() => onSessionChanged(), 500);
        if (onClose) onClose();
        if (setCurrentSessionId) setCurrentSessionId(result.data ? result.data.id : null);
      } else {
        throw new Error(result.error || "Failed to open register");
      }
    } catch (err) {
      setError(err.message || "Failed to open register");
    } finally {
      setActionLoading(false);
    }
  };

  // Cash in
  const handleCashIn = async () => {
    if (!canOperate) return;
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cash-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: session.id,
          user_id: user.id,
          type: "cash_in",
          amount: cashInAmount,
          reason: cashInReason,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setCashInAmount(0);
        setCashInReason("");
        setShowQuickCashIn(false);
        // Refresh movements
        setActionLoading(true);
      } else {
        throw new Error(result.error || "Failed to add cash in");
      }
    } catch (err) {
      setError(err.message || "Failed to add cash in");
    } finally {
      setActionLoading(false);
    }
  };

  // Cash out
  const handleCashOut = async () => {
    if (!canOperate) return;
    if (cashOutAmount > 1000) {
      setShowLargeOutConfirm(true);
      return;
    }
    await doCashOut();
  };

  const doCashOut = async () => {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cash-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: session.id,
          user_id: user.id,
          type: "cash_out",
          amount: cashOutAmount,
          reason: cashOutReason,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setCashOutAmount(0);
        setCashOutReason("");
        setShowQuickCashOut(false);
        setShowLargeOutConfirm(false);
        // Refresh movements
        setActionLoading(true);
      } else {
        throw new Error(result.error || "Failed to add cash out");
      }
    } catch (err) {
      setError(err.message || "Failed to add cash out");
    } finally {
      setActionLoading(false);
    }
  };

  // Close register
  const handleCloseRegister = async () => {
    if (!canOperate) return;
    setShowCloseConfirm(true);
  };

  const doCloseRegister = async () => {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/cash-register-sessions/${session.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "closed",
            closing_cash: closeAmount,
            close_note: closeNote,
          }),
        }
      );
      const result = await response.json();
      if (result.success) {
        setSession(null);
        setCloseAmount(0);
        setCloseNote("");
        setShowCloseConfirm(false);
        if (onSessionChanged) await onSessionChanged();
        if (onSessionChanged) setTimeout(() => onSessionChanged(), 500);
        // Generate Z-Report
        const zReportResponse = await fetch(
          `/api/cash-register-sessions/${session.id}/z-report`
        );
        const zReportResult = await zReportResponse.json();
        if (zReportResult.success) {
          console.log("Z-Report API result:", zReportResult);
          setZReport(zReportResult.data);
        }
      } else {
        throw new Error(result.error || "Failed to close register");
      }
    } catch (err) {
      setError(err.message || "Failed to close register");
    } finally {
      setActionLoading(false);
    }
  };

  // Print Z-Report
  const handlePrintZReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const session = zReport?.data?.session || zReport?.session || {};
    const paymentBreakdown = zReport?.data?.paymentBreakdown || zReport?.paymentBreakdown || {};
    const productsSold = zReport?.data?.productsSold || zReport?.productsSold || [];
    const operator = session.user || session.user_id || 'N/A';
    const openedAt = session.opened_at ? new Date(session.opened_at).toLocaleString() : 'N/A';
    const closedAt = session.closed_at ? new Date(session.closed_at).toLocaleString() : 'N/A';
    
    // Get register name from session register_id or fallback to selectedRegister
    const sessionRegisterId = session.register_id || selectedRegister;
    const registerName = registers.find((r) => r.id === sessionRegisterId)?.name || 'Unknown Register';
    const printContent = `
      <html>
        <head>
          <title>Z-Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 13px; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Z-Report</h1>
            <p>Register: ${registerName}</p>
          </div>
          <div class="section">
            <h3>Session Period</h3>
            <div class="row"><span>${openedAt}</span><span>to</span><span>${closedAt}</span></div>
            <div class="row"><span>Operator</span><span>${operator}</span></div>
            <div class="row total"><span>Over/Short</span><span>GHS ${session.over_short !== undefined ? Number(session.over_short).toFixed(2) : 'N/A'}</span></div>
            <div class="row"><span>Opening Cash</span><span>GHS ${session.opening_cash !== undefined ? Number(session.opening_cash).toFixed(2) : 'N/A'}</span></div>
            <div class="row"><span>Closing Cash</span><span>GHS ${session.closing_cash !== undefined ? Number(session.closing_cash).toFixed(2) : 'N/A'}</span></div>
            <div class="row"><span>Total Sales</span><span>GHS ${zReport?.data?.totalSales !== undefined ? Number(zReport.data.totalSales).toFixed(2) : 'N/A'}</span></div>
          </div>
          <div class="section">
            <h3>Payment Breakdown</h3>
            <table>
              <thead><tr><th>Type</th><th>Amount</th></tr></thead>
              <tbody>
                ${Object.entries(paymentBreakdown).map(([type, amount]) => `<tr><td>${type.replace('_', ' ')} Payment</td><td>GHS ${Number(amount).toFixed(2)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h3>Products Sold</h3>
            <table>
              <thead><tr><th>Product</th><th>Quantity</th><th>Total</th></tr></thead>
              <tbody>
                ${productsSold.length > 0 ? productsSold.map(prod => `<tr><td>${prod.name}</td><td>${prod.quantity}</td><td>GHS ${Number(prod.total).toFixed(2)}</td></tr>`).join('') : `<tr><td colspan="3" style="text-align:center;color:#888;">No products sold</td></tr>`}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  function exportZReportCSV(zReport) {
    const session = zReport?.data?.session || zReport?.session || {};
    const sessionRegisterId = session.register_id || selectedRegister;
    const registerName = registers.find((r) => r.id === sessionRegisterId)?.name || 'Unknown Register';
    
    const csvContent = [
      ["Z-Report"],
      [
        "Register",
        registerName,
      ],
      ["Date", new Date().toLocaleString()],
      [""],
      ["Opening Cash", zReport.opening_cash],
      ["Closing Cash", zReport.closing_cash],
      ["Sales", zReport.sales],
      ["Over/Short", zReport.over_short],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `z-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <>
      <SimpleModal
        isOpen={isOpen}
        onClose={onClose}
        title="Cash Register"
        width="max-w-4xl"
        disableOutsideClick={true}
      >
        <div className="space-y-6">
          {user && user.role === "admin" && (
            <AddRegisterForm
              onRegisterAdded={async () => {
                try {
                  const response = await fetch("/api/registers");
                  const result = await response.json();
                  if (result.success) {
                    setRegisters(result.data || []);
                    if (
                      result.data &&
                      result.data.length > 0 &&
                      !selectedRegister
                    ) {
                      setSelectedRegister(result.data[0].id);
                    }
                  }
                } catch (err) {
                  console.error("Failed to refresh registers:", err);
                }
              }}
            />
          )}
          <RegisterSelector
            registers={filteredRegisters}
            selectedRegister={selectedRegister}
            setSelectedRegister={setSelectedRegister}
            disabled={user?.role === 'cashier' || filteredRegisters.length === 0}
          />
          {error && <div className="text-red-600">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Icon
                  icon="mdi:loading"
                  className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-4"
                />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : zReport ? (
            <ZReportView 
              zReport={zReport} 
              onPrint={handlePrintZReport} 
              showPrintButton={true} 
              onClose={() => {
                setZReport(null);
                setSession(null);
                if (onSessionChanged) onSessionChanged();
              }}
            />
          ) : session ? (
            <>
              {/* Session Overview - Always Visible */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Register Open
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    Session Duration: {Math.floor(sessionDuration / 60)}h{" "}
                    {sessionDuration % 60}m {sessionDurationSeconds}s
                  </div>
                </div>
                
                {/* Cash Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Opening Cash</div>
                    <div className="font-bold text-lg text-blue-600">
                      GHS {Number(session.opening_cash).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Current Cash</div>
                    <div className="font-bold text-lg text-green-600">
                      GHS {Number(currentCash).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Cash In</div>
                    <div className="font-bold text-lg text-emerald-600">
                      GHS{" "}
                      {Number(
                        movements
                          .filter((m) => m.type === "cash_in")
                          .reduce((sum, m) => sum + m.amount, 0)
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Cash Out</div>
                    <div className="font-bold text-lg text-red-600">
                      GHS{" "}
                      {Number(
                        movements
                          .filter((m) => m.type === "cash_out")
                          .reduce((sum, m) => sum + m.amount, 0)
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowQuickCashIn(true)}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Icon icon="mdi:plus-circle" className="w-5 h-5" />
                    <span className="hidden sm:inline">Quick Cash In</span>
                    <span className="sm:hidden">Cash In</span>
                  </button>
                  <button
                    onClick={() => setShowQuickCashOut(true)}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Icon icon="mdi:minus-circle" className="w-5 h-5" />
                    <span className="hidden sm:inline">Quick Cash Out</span>
                    <span className="sm:hidden">Cash Out</span>
                  </button>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Icon icon={showHistory ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-5 h-5" />
                    <span className="hidden sm:inline">{showHistory ? "Hide" : "Show"} History</span>
                    <span className="sm:hidden">History</span>
                  </button>
                </div>
              </div>

              {/* Quick Cash In Modal */}
              {showQuickCashIn && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Icon icon="mdi:plus-circle" className="w-5 h-5 text-green-600" />
                      Quick Cash In
                    </h4>
                    <button
                      onClick={() => setShowQuickCashIn(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      value={cashInAmount || ""}
                      onChange={(e) => setCashInAmount(Number(e.target.value))}
                      placeholder="Amount"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      value={cashInReason}
                      onChange={(e) => setCashInReason(e.target.value)}
                      placeholder="Reason"
                      className="border rounded px-3 py-2"
                    />
                    <button
                      onClick={handleCashIn}
                      disabled={actionLoading || !cashInAmount || !cashInReason}
                      className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      {actionLoading ? "Adding..." : "Add Cash In"}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Cash Out Modal */}
              {showQuickCashOut && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Icon icon="mdi:minus-circle" className="w-5 h-5 text-red-600" />
                      Quick Cash Out
                    </h4>
                    <button
                      onClick={() => setShowQuickCashOut(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      value={cashOutAmount || ""}
                      onChange={(e) => setCashOutAmount(Number(e.target.value))}
                      placeholder="Amount"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      value={cashOutReason}
                      onChange={(e) => setCashOutReason(e.target.value)}
                      placeholder="Reason"
                      className="border rounded px-3 py-2"
                    />
                    <button
                      onClick={handleCashOut}
                      disabled={actionLoading || !cashOutAmount || !cashOutReason}
                      className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      {actionLoading ? "Adding..." : "Add Cash Out"}
                    </button>
                  </div>
                </div>
              )}



              {/* History Section - Collapsible */}
              {showHistory && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Icon icon="mdi:history" className="w-5 h-5 text-gray-600" />
                    Movement History
                  </h4>
                  <MovementLog movements={movements} userMap={userMap} />
                </div>
              )}

              {/* Sales Summary */}
              <SalesSummary session={session} salesSummary={salesSummary} movements={movements} />

              <CashCountSection
                session={session}
                salesSummary={salesSummary}
                movements={movements}
                closeAmount={closeAmount}
                setCloseAmount={setCloseAmount}
                closeNote={closeNote}
                setCloseNote={setCloseNote}
                handleCloseRegister={handleCloseRegister}
                actionLoading={actionLoading}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon
                  icon="material-symbols:point-of-sale"
                  className="w-8 h-8 text-gray-400"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Register Closed
              </h3>
              <p className="text-gray-600 mb-6">
                Open the register to start a new session
              </p>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon
                    icon="material-symbols:open-in-new"
                    className="w-5 h-5 text-green-600"
                  />
                  Cash in Hand
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={
                      openAmount === undefined || openAmount === null
                        ? ""
                        : openAmount
                    }
                    onChange={(e) =>
                      setOpenAmount(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                    placeholder="Opening Cash Amount"
                    className="border rounded px-3 py-2"
                  />
                  <button
                    onClick={handleOpenRegister}
                    disabled={
                      actionLoading ||
                      !canOperate ||
                      !selectedRegister ||
                      openAmount === undefined ||
                      openAmount === null
                    }
                    className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? "Opening..." : "Open Register"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SimpleModal>

      {/* ExportModal rendered outside the SimpleModal for Z-Report */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          users={exportType === 'products'
            ? (zReport?.data?.productsSold || zReport?.productsSold || [])
            : Object.entries(zReport?.data?.paymentBreakdown || zReport?.paymentBreakdown || {}).map(([type, amount]) => ({ type, amount }))}
          mode="light"
          type="zreport"
          title="Export Z-Report Data"
          stores={[]}
          // Custom fields for Z-Report
          getDefaultFields={() => exportType === 'products'
            ? { name: true, quantity: true, total: true }
            : { type: true, amount: true }}
          getFieldsOrder={() => exportType === 'products'
            ? [
                { label: "Product", key: "name", icon: "mdi:package-variant" },
                { label: "Quantity", key: "quantity", icon: "mdi:counter" },
                { label: "Total", key: "total", icon: "mdi:currency-cedi" },
              ]
            : [
                { label: "Type", key: "type", icon: "mdi:credit-card-outline" },
                { label: "Amount", key: "amount", icon: "mdi:currency-cedi" },
              ]}
          onToggleType={setExportType}
          zreportTab={exportType}
        />
      )}

      {/* Confirmation Modals (now outside SimpleModal) */}
      {showCloseConfirm && (
        <SimpleModal
          isOpen={true}
          onClose={() => setShowCloseConfirm(false)}
          title="Close Register?"
          width="max-w-md"
          disableOutsideClick={true}
        >
          <div className="p-2">
            <p className="text-gray-600 mb-6">
              Are you sure you want to close the register? This will end the
              current session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={doCloseRegister}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Close Register
              </button>
            </div>
          </div>
        </SimpleModal>
      )}

      {showLargeOutConfirm && (
        <SimpleModal
          isOpen={true}
          onClose={() => setShowLargeOutConfirm(false)}
          title="Large Cash Out"
          width="max-w-md"
          disableOutsideClick={true}
        >
          <div className="p-2">
            <p className="text-gray-600 mb-6">
              You are about to remove GHS {cashOutAmount} from the register.
              This is a large amount. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLargeOutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={doCashOut}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded"
              >
                Confirm Cash Out
              </button>
            </div>
          </div>
        </SimpleModal>
      )}
    </>
  );
};

export default CashRegisterModal;
