import { useState, useEffect, useRef } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import { useModal } from "./ModalContext";

const allowedRoles = ["cashier", "manager", "admin"];

const CashRegisterModal = ({ isOpen, onClose, user, onSessionChanged }) => {
  const [registers, setRegisters] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
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
  const { showGlobalConfirm } = useModal();
  const [stores, setStores] = useState([]);

  // Fetch available registers
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const response = await fetch('/api/registers');
        const result = await response.json();
        if (result.success) {
          setRegisters(result.data || []);
          if (result.data && result.data.length > 0 && !selectedRegister) {
            setSelectedRegister(result.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch registers:", err);
      }
    })();
  }, [isOpen]);

  // Fetch current open session for selected register
  useEffect(() => {
    if (!isOpen || !selectedRegister) return;
    setLoading(true);
    (async () => {
      try {
        const sessionsResponse = await fetch(`/api/cash-register-sessions?register_id=${selectedRegister}&status=open`);
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.success) {
          const currentSession = sessionsData.data && sessionsData.data[0];
          setSession(currentSession || null);
        } else {
          setSession(null);
        }
      } catch (err) {
        console.error("Failed to fetch session data:", err);
        setSession(null);
      }
      setLoading(false);
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
        const movementsResponse = await fetch(`/api/cash-movements?session_id=${session.id}`);
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
    const uniqueUserIds = Array.from(new Set(movements.map(m => m.user_id).filter(Boolean)));
    if (!uniqueUserIds.length) return;
    
    (async () => {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        if (result.success) {
          const map = {};
          (result.data || []).forEach(u => {
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

  // Fetch all stores on mount
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/stores');
        const result = await response.json();
        if (result.success) {
          setStores(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch stores:", err);
      }
    })();
  }, []);

  // Permissions check
  const canOperate = user && allowedRoles.includes(user.role);

  // Timer for live session duration
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Live session info
  let sessionDuration = 0, sessionDurationSeconds = 0;
  if (session) {
    const ms = now - new Date(session.opened_at).getTime();
    sessionDuration = Math.floor(ms / 60000); // minutes
    sessionDurationSeconds = Math.floor((ms % 60000) / 1000); // seconds
  }

  // Open register
  const handleOpenRegister = async () => {
    if (!canOperate || !selectedRegister) return;
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch('/api/cash-register-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          opening_cash: openAmount,
          status: "open",
          register_id: selectedRegister,
        })
      });
      const result = await response.json();
      if (result.success) {
        setSession(result.data);
        setOpenAmount(0);
        if (onSessionChanged) onSessionChanged();
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
      const response = await fetch('/api/cash-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session.id,
          user_id: user.id,
          type: "cash_in",
          amount: cashInAmount,
          reason: cashInReason,
        })
      });
      const result = await response.json();
      if (result.success) {
        setCashInAmount(0);
        setCashInReason("");
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
      const response = await fetch('/api/cash-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session.id,
          user_id: user.id,
          type: "cash_out",
          amount: cashOutAmount,
          reason: cashOutReason,
        })
      });
      const result = await response.json();
      if (result.success) {
        setCashOutAmount(0);
        setCashOutReason("");
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
      const response = await fetch(`/api/cash-register-sessions/${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: "closed",
          closing_cash: closeAmount,
        })
      });
      const result = await response.json();
      if (result.success) {
        setSession(null);
        setCloseAmount(0);
        setShowCloseConfirm(false);
        if (onSessionChanged) onSessionChanged();
        // Generate Z-Report
        const zReportResponse = await fetch(`/api/cash-register-sessions/${session.id}/z-report`);
        const zReportResult = await zReportResponse.json();
        if (zReportResult.success && zReportResult.data) {
          console.log('Z-Report API result:', zReportResult);
          setZReport(zReportResult.data);
        } else {
          setZReport(null);
          setSession(null);
          setError("Z-Report data not available.");
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Z-Report</h1>
            <p>Register: ${registers.find(r => r.id === selectedRegister)?.name || selectedRegister}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
          <div class="section">
            <h3>Session Summary</h3>
            <div class="row">
              <span>Opening Cash:</span>
              <span>GHS ${zReport.opening_cash}</span>
            </div>
            <div class="row">
              <span>Closing Cash:</span>
              <span>GHS ${zReport.closing_cash}</span>
            </div>
            <div class="row">
              <span>Sales:</span>
              <span>GHS ${zReport.sales}</span>
            </div>
            <div class="row total">
              <span>Over/Short:</span>
              <span>GHS ${zReport.over_short}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  function exportZReportCSV(zReport) {
    const csvContent = [
      ['Z-Report'],
      ['Register', registers.find(r => r.id === selectedRegister)?.name || selectedRegister],
      ['Date', new Date().toLocaleString()],
      [''],
      ['Opening Cash', zReport.opening_cash],
      ['Closing Cash', zReport.closing_cash],
      ['Sales', zReport.sales],
      ['Over/Short', zReport.over_short],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `z-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function AddRegisterForm({ onRegisterAdded }) {
    const [name, setName] = useState("");
    const [storeId, setStoreId] = useState("");
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      (async () => {
        try {
          const response = await fetch('/api/stores');
          const result = await response.json();
          if (result.success) {
            setStores(result.data || []);
          }
        } catch (err) {
          console.error("Failed to fetch stores:", err);
        }
      })();
    }, []);

    const handleAdd = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/registers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, store_id: storeId })
        });
        const result = await response.json();
        if (result.success) {
          setName("");
          setStoreId("");
          if (onRegisterAdded) onRegisterAdded();
          alert("Register added!");
        } else {
          throw new Error(result.error || "Failed to add register");
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="mb-4 flex gap-2 items-end">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Register Name"
          className="border rounded px-3 py-2"
        />
        <select
          value={storeId}
          onChange={e => setStoreId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Select Store</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={loading || !name || !storeId}
          className="bg-blue-700 text-white rounded px-4 py-2 font-semibold"
        >
          {loading ? "Adding..." : "Add Register"}
        </button>
      </div>
    );
  }

  // Find the selected register's store name
  const storeName = (() => {
    const reg = registers.find(r => r.id === selectedRegister);
    return reg && reg.store_name ? reg.store_name : '';
  })();

  // Find the logged-in user's assigned store name
  const userStoreName = (() => {
    if (!user || !user.store_id || !stores.length) return '';
    const store = stores.find(s => String(s.id) === String(user.store_id));
    const name = store ? store.name : '';
    console.log('CashRegisterModal user:', user);
    console.log('CashRegisterModal user.store_id:', user && user.store_id);
    console.log('CashRegisterModal resolved userStoreName:', name);
    return name;
  })();

  return (
    <>
      <SimpleModal
        isOpen={isOpen}
        onClose={onClose}
        title={<>
          Cash Register
          {stores.length === 0
            ? <span className="ml-2 ">- Loading store...</span>
            : userStoreName && <span className="ml-2 ">- {userStoreName}</span>
          }
        </>}
        width="max-w-2xl"
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
          <div className="mb-2">
            <label className="block text-sm font-semibold mb-1">Register</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={selectedRegister || ""}
              onChange={(e) => setSelectedRegister(e.target.value)}
              disabled={registers.length === 0}
            >
              {registers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || `Register ${r.id}`}
                </option>
              ))}
            </select>
          </div>
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
          ) : zReport && zReport.data && zReport.data.session ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <Icon
                    icon="material-symbols:receipt-long"
                    className="w-8 h-8 text-green-600"
                  />
                  <h3 className="text-2xl font-bold text-gray-800">Z-Report</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Session Period</div>
                    <div className="font-semibold">
                      {zReport?.data?.session?.opened_at ? new Date(zReport.data.session.opened_at).toLocaleString() : "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">to</div>
                    <div className="font-semibold">
                      {zReport?.data?.session?.closed_at ? new Date(zReport.data.session.closed_at).toLocaleString() : "N/A"}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Operator</div>
                    <div className="font-semibold text-lg">{zReport?.data?.session?.user || "N/A"}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Over/Short</div>
                    <div
                      className={`font-bold text-lg ${
                        (zReport?.data?.session?.over_short || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      GHS {Number(zReport?.data?.session?.over_short || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Opening Cash</div>
                    <div className="font-bold text-lg text-blue-600">
                      GHS {Number(zReport?.data?.session?.opening_cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Closing Cash</div>
                    <div className="font-bold text-lg text-indigo-600">
                      GHS {Number(zReport?.data?.session?.closing_cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Total Sales</div>
                    <div className="font-bold text-lg text-green-600">
                      GHS {Number(zReport?.data?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Total Payment</div>
                    <div className="font-bold text-lg text-purple-600">
                      GHS {Number(zReport?.data?.totalPayment || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Total Expense</div>
                    <div className="font-bold text-lg text-red-600">
                      GHS {Number(zReport?.data?.totalExpense || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Cash in Hand</div>
                    <div className="font-bold text-lg text-blue-700">
                      GHS {Number(zReport?.data?.cashInHand || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Total Cash</div>
                    <div className="font-bold text-lg text-green-700">
                      GHS {Number(zReport?.data?.totalCash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                {/* Payment Breakdown */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Payment Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {zReport?.data?.paymentBreakdown ? Object.entries(zReport.data.paymentBreakdown).map(([type, amount]) => (
                      <div key={type} className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xs text-gray-500 capitalize">{type.replace('_', ' ')} Payment</div>
                        <div className="font-bold text-gray-800">GHS {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    )) : <div className="col-span-6 text-center text-gray-400">No payment breakdown</div>}
                  </div>
                </div>
                {/* Products Sold Table */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Products Sold</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border">Product</th>
                          <th className="px-4 py-2 border">Quantity</th>
                          <th className="px-4 py-2 border">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zReport?.data?.productsSold && zReport.data.productsSold.length === 0 ? (
                          <tr><td colSpan={3} className="text-center py-4 text-gray-400">No products sold</td></tr>
                        ) : (
                          zReport?.data?.productsSold?.map((prod, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 border">{prod.name}</td>
                              <td className="px-4 py-2 border text-center">{prod.quantity}</td>
                              <td className="px-4 py-2 border text-right">GHS {Number(prod.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                    onClick={handlePrintZReport}
                  >
                    <Icon icon="material-symbols:print" className="w-5 h-5" /> Print Z-Report
                  </button>
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                    onClick={() => exportZReportCSV(zReport.data)}
                  >
                    <Icon icon="material-symbols:download" className="w-5 h-5" /> Export CSV
                  </button>
                </div>
              </div>
              <button
                className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-6 py-3 font-semibold transition-all"
                onClick={() => {
                  setZReport(null);
                  setSession(null);
                  setError("");
                }}
              >
                Close Report
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="material-symbols:point-of-sale" className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Register Closed</h3>
              <p className="text-gray-600 mb-6">Open the register to start a new session</p>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon icon="material-symbols:open-in-new" className="w-5 h-5 text-green-600" />
                  Cash in Hand
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={openAmount === undefined || openAmount === null ? "" : openAmount}
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

      {/* Confirmation Modals (now outside SimpleModal) */}
      {showCloseConfirm && (
        <SimpleModal
          isOpen={true}
          onClose={() => setShowCloseConfirm(false)}
          title="Close Register?"
          width="max-w-md"
        >
          <div className="p-2">
            <p className="text-gray-600 mb-6">
              Are you sure you want to close the register? This will end the
              current session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={doCloseRegister}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded"
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