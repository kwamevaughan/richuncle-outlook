import { useState, useEffect, useRef } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import { useModal } from "./ModalContext";

const allowedRoles = ["cashier", "manager", "admin"];

const CashRegisterModal = ({ isOpen, onClose, user }) => {
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
  const sessionSubRef = useRef(null);
  const movementSubRef = useRef(null);
  const [userMap, setUserMap] = useState({});
  const { showGlobalConfirm } = useModal();

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

  // Fetch current open session and movements for selected register
  useEffect(() => {
    if (!isOpen || !selectedRegister) return;
    setLoading(true);
    (async () => {
      try {
        const [sessionsResponse, movementsResponse] = await Promise.all([
          fetch(`/api/cash-register-sessions?register_id=${selectedRegister}&status=open`),
          fetch(`/api/cash-movements?session_id=${selectedRegister}`)
        ]);
        
        const sessionsData = await sessionsResponse.json();
        const movementsData = await movementsResponse.json();
        
        if (sessionsData.success) {
          const currentSession = sessionsData.data && sessionsData.data[0];
          setSession(currentSession || null);
          
          if (currentSession && movementsData.success) {
            setMovements(movementsData.data || []);
          } else {
            setMovements([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch session data:", err);
      }
      setLoading(false);
    })();
  }, [isOpen, actionLoading, selectedRegister]);

  // Real-time updates for sessions and movements
  useEffect(() => {
    if (!isOpen || !selectedRegister) return;
    // Subscribe to session changes for this register
    if (sessionSubRef.current) sessionSubRef.current.unsubscribe();
    sessionSubRef.current = supabaseClient
      .channel('cash_register_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_register_sessions', filter: `register_id=eq.${selectedRegister}` }, payload => {
        // Refetch session on any change
        setLoading(true);
        (async () => {
          const { data: sessions } = await supabaseClient
            .from("cash_register_sessions")
            .select("*")
            .eq("status", "open")
            .eq("register_id", selectedRegister)
            .order("opened_at", { ascending: false })
            .limit(1);
          const currentSession = sessions && sessions[0];
          setSession(currentSession || null);
          setLoading(false);
        })();
      })
      .subscribe();
    return () => {
      if (sessionSubRef.current) sessionSubRef.current.unsubscribe();
    };
  }, [isOpen, selectedRegister]);

  useEffect(() => {
    if (!isOpen || !session) return;
    // Subscribe to movement changes for this session
    if (movementSubRef.current) movementSubRef.current.unsubscribe();
    movementSubRef.current = supabaseClient
      .channel('cash_movements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_movements', filter: `session_id=eq.${session.id}` }, payload => {
        // Refetch movements on any change
        setLoading(true);
        (async () => {
          const { data: moves } = await supabaseClient
            .from("cash_movements")
            .select("*")
            .eq("session_id", session.id)
            .order("created_at", { ascending: true });
          setMovements(moves || []);
          setLoading(false);
        })();
      })
      .subscribe();
    return () => {
      if (movementSubRef.current) movementSubRef.current.unsubscribe();
    };
  }, [isOpen, session]);

  // Fetch user names for movements
  useEffect(() => {
    if (!movements.length) return;
    const uniqueUserIds = Array.from(new Set(movements.map(m => m.user_id).filter(Boolean)));
    if (!uniqueUserIds.length) return;
    supabaseClient
      .from('users')
      .select('id, name, full_name')
      .in('id', uniqueUserIds)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(u => {
          map[u.id] = u.name || u.full_name || u.id;
        });
        setUserMap(map);
      });
  }, [movements]);

  // Permissions check
  const canOperate = user && allowedRoles.includes(user.role);

  // Live session info
  const sessionDuration = session ? Math.floor((Date.now() - new Date(session.opened_at).getTime()) / 60000) : 0;

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
          type: "in",
          amount: cashInAmount,
          reason: cashInReason,
          user_id: user.id,
        })
      });
      const result = await response.json();
      if (result.success) {
        setCashInAmount(0);
        setCashInReason("");
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
    if (cashOutAmount > 500) { // Large cash out threshold
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
          type: "out",
          amount: cashOutAmount,
          reason: cashOutReason,
          user_id: user.id,
        })
      });
      const result = await response.json();
      if (result.success) {
        setCashOutAmount(0);
        setCashOutReason("");
      } else {
        throw new Error(result.error || "Failed to add cash out");
      }
    } catch (err) {
      setError(err.message || "Failed to add cash out");
    } finally {
      setActionLoading(false);
      setShowLargeOutConfirm(false);
    }
  };

  // Close register
  const handleCloseRegister = async () => {
    if (!canOperate) return;
    showGlobalConfirm("Are you sure you want to close the register?", doCloseRegister);
  };
  const doCloseRegister = async () => {
    setActionLoading(true);
    setError("");
    try {
      // Calculate expected cash
      const cashIn = movements.filter(m => m.type === "in").reduce((sum, m) => sum + Number(m.amount), 0);
      const cashOut = movements.filter(m => m.type === "out").reduce((sum, m) => sum + Number(m.amount), 0);
      const sales = movements.filter(m => m.type === "sale").reduce((sum, m) => sum + Number(m.amount), 0);
      const refunds = movements.filter(m => m.type === "refund").reduce((sum, m) => sum + Number(m.amount), 0);
      const expected = Number(session.opening_cash) + cashIn - cashOut + sales - refunds;
      const overShort = Number(closeAmount) - expected;
      await supabaseClient
        .from("cash_register_sessions")
        .update({
          closed_at: new Date().toISOString(),
          closing_cash: closeAmount,
          expected_cash: expected,
          over_short: overShort,
          status: "closed",
        })
        .eq("id", session.id);
      // Generate Z-Report
      setZReport({
        opened_at: session.opened_at,
        closed_at: new Date().toISOString(),
        user: user.name,
        opening_cash: session.opening_cash,
        closing_cash: closeAmount,
        cash_in: cashIn,
        cash_out: cashOut,
        sales,
        refunds,
        expected,
        over_short: overShort,
        movements,
      });
      setSession(null);
      setCloseAmount(0);
    } catch (err) {
      setError(err.message || "Failed to close register");
    } finally {
      setActionLoading(false);
    }
  };

  // Session summary
  const cashIn = movements.filter(m => m.type === "in").reduce((sum, m) => sum + Number(m.amount), 0);
  const cashOut = movements.filter(m => m.type === "out").reduce((sum, m) => sum + Number(m.amount), 0);
  const sales = movements.filter(m => m.type === "sale").reduce((sum, m) => sum + Number(m.amount), 0);
  const refunds = movements.filter(m => m.type === "refund").reduce((sum, m) => sum + Number(m.amount), 0);
  const expected = session ? Number(session.opening_cash) + cashIn - cashOut + sales - refunds : 0;

  // Print/export Z-Report
  const handlePrintZReport = () => {
    if (!zReport) return;
    const content = `
      <html><head><title>Z-Report</title></head><body>
      <h2>Z-Report</h2>
      <div>Opened: ${new Date(zReport.opened_at).toLocaleString()}</div>
      <div>Closed: ${new Date(zReport.closed_at).toLocaleString()}</div>
      <div>User: ${zReport.user}</div>
      <div>Opening Cash: GHS ${Number(zReport.opening_cash).toLocaleString()}</div>
      <div>Closing Cash: GHS ${Number(zReport.closing_cash).toLocaleString()}</div>
      <div>Cash In: GHS ${Number(zReport.cash_in).toLocaleString()}</div>
      <div>Cash Out: GHS ${Number(zReport.cash_out).toLocaleString()}</div>
      <div>Sales: GHS ${Number(zReport.sales).toLocaleString()}</div>
      <div>Refunds: GHS ${Number(zReport.refunds).toLocaleString()}</div>
      <div>Expected Cash: GHS ${Number(zReport.expected).toLocaleString()}</div>
      <div>Over/Short: GHS ${Number(zReport.over_short).toLocaleString()}</div>
      <hr />
      <h4>Movements</h4>
      <table border="1" cellpadding="4" cellspacing="0">
        <tr><th>Type</th><th>Amount</th><th>Reason</th><th>User</th><th>Time</th></tr>
        ${zReport.movements.map(m => `<tr><td>${m.type}</td><td>GHS ${Number(m.amount).toLocaleString()}</td><td>${m.reason || '-'}</td><td>${userMap[m.user_id] || m.user_id}</td><td>${new Date(m.created_at).toLocaleTimeString()}</td></tr>`).join('')}
      </table>
      </body></html>
    `;
    const win = window.open('', 'ZReport', 'width=800,height=600');
    win.document.write(content);
    win.document.close();
    win.print();
  };

  // Add CSV export helper
  function exportZReportCSV(zReport) {
    if (!zReport) return;
    let csv = `Field,Value\n`;
    csv += `Opened,${new Date(zReport.opened_at).toLocaleString()}\n`;
    csv += `Closed,${new Date(zReport.closed_at).toLocaleString()}\n`;
    csv += `User,${zReport.user}\n`;
    csv += `Opening Cash,GHS ${Number(zReport.opening_cash).toLocaleString()}\n`;
    csv += `Closing Cash,GHS ${Number(zReport.closing_cash).toLocaleString()}\n`;
    csv += `Cash In,GHS ${Number(zReport.cash_in).toLocaleString()}\n`;
    csv += `Cash Out,GHS ${Number(zReport.cash_out).toLocaleString()}\n`;
    csv += `Sales,GHS ${Number(zReport.sales).toLocaleString()}\n`;
    csv += `Refunds,GHS ${Number(zReport.refunds).toLocaleString()}\n`;
    csv += `Expected Cash,GHS ${Number(zReport.expected).toLocaleString()}\n`;
    csv += `Over/Short,GHS ${Number(zReport.over_short).toLocaleString()}\n`;
    csv += `\nMovements\nType,Amount,Reason,User,Time\n`;
    csv += zReport.movements.map(m => `${m.type},GHS ${Number(m.amount).toLocaleString()},${m.reason || '-'},${userMap[m.user_id] || m.user_id},${new Date(m.created_at).toLocaleTimeString()}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `z-report-${zReport.opened_at}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function AddRegisterForm({ onRegisterAdded }) {
    const [name, setName] = useState("");
    const [storeId, setStoreId] = useState("");
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      supabaseClient.from("stores").select("id, name").then(({ data }) => setStores(data || []));
    }, []);

    const handleAdd = async () => {
      setLoading(true);
      const { error } = await supabaseClient
        .from("registers")
        .insert([{ name, store_id: storeId }]);
      setLoading(false);
      if (!error) {
        setName("");
        setStoreId("");
        if (onRegisterAdded) onRegisterAdded();
        alert("Register added!");
      } else {
        alert("Error: " + error.message);
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

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cash Register"
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {user && user.role === "admin" && (
          <AddRegisterForm
            onRegisterAdded={async () => {
              const { data } = await supabaseClient
                .from("registers")
                .select("*");
              setRegisters(data || []);
              if (data && data.length > 0 && !selectedRegister) {
                setSelectedRegister(data[0].id);
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
        ) : zReport ? (
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
                    {new Date(zReport.opened_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">to</div>
                  <div className="font-semibold">
                    {new Date(zReport.closed_at).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600">Operator</div>
                  <div className="font-semibold text-lg">{zReport.user}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600">Over/Short</div>
                  <div
                    className={`font-bold text-lg ${
                      zReport.over_short >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    GHS {Number(zReport.over_short).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Opening Cash",
                    value: zReport.opening_cash,
                    color: "blue",
                  },
                  {
                    label: "Closing Cash",
                    value: zReport.closing_cash,
                    color: "indigo",
                  },
                  { label: "Sales", value: zReport.sales, color: "green" },
                  {
                    label: "Expected",
                    value: zReport.expected,
                    color: "purple",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="text-sm text-gray-600">{item.label}</div>
                    <div className={`font-bold text-lg text-${item.color}-600`}>
                      GHS {Number(item.value).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  onClick={handlePrintZReport}
                >
                  <Icon icon="material-symbols:print" className="w-5 h-5" />{" "}
                  Print Z-Report
                </button>
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  onClick={() => exportZReportCSV(zReport)}
                >
                  <Icon icon="material-symbols:download" className="w-5 h-5" />{" "}
                  Export CSV
                </button>
              </div>
            </div>
            <button
              className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-6 py-3 font-semibold transition-all"
              onClick={() => setZReport(null)}
            >
              Close Report
            </button>
          </div>
        ) : session ? (
          <>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Session Active
                  </h3>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(session.opened_at).toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    GHS {Number(session.opening_cash).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Opening Cash</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sessionDuration} min
                  </div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-600">Operator</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    GHS {expected.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Expected</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <Icon
                    icon="material-symbols:add-circle"
                    className="w-6 h-6 text-green-600"
                  />
                  <h4 className="text-lg font-semibold text-gray-800">
                    Cash In
                  </h4>
                </div>
                <div className="space-y-4">
                  <input
                    type="number"
                    className="w-full border border-green-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="Amount (GHS)"
                    value={cashInAmount}
                    onChange={(e) => setCashInAmount(e.target.value)}
                    disabled={!canOperate}
                  />
                  <input
                    type="text"
                    className="w-full border border-green-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="Reason"
                    value={cashInReason}
                    onChange={(e) => setCashInReason(e.target.value)}
                    disabled={!canOperate}
                  />
                  <button
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg py-3 font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                    onClick={handleCashIn}
                    disabled={actionLoading || !cashInAmount || !canOperate}
                  >
                    Add Cash In
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <Icon
                    icon="material-symbols:remove-circle"
                    className="w-6 h-6 text-red-600"
                  />
                  <h4 className="text-lg font-semibold text-gray-800">
                    Cash Out
                  </h4>
                </div>
                <div className="space-y-4">
                  <input
                    type="number"
                    className="w-full border border-red-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    placeholder="Amount (GHS)"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                    disabled={!canOperate}
                  />
                  <input
                    type="text"
                    className="w-full border border-red-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    placeholder="Reason"
                    value={cashOutReason}
                    onChange={(e) => setCashOutReason(e.target.value)}
                    disabled={!canOperate}
                  />
                  <button
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg py-3 font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                    onClick={handleCashOut}
                    disabled={actionLoading || !cashOutAmount || !canOperate}
                  >
                    Add Cash Out
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                {
                  label: "Cash In",
                  value: cashIn,
                  color: "green",
                  icon: "material-symbols:trending-up",
                },
                {
                  label: "Cash Out",
                  value: cashOut,
                  color: "red",
                  icon: "material-symbols:trending-down",
                },
                {
                  label: "Sales",
                  value: sales,
                  color: "blue",
                  icon: "material-symbols:shopping-cart",
                },
                {
                  label: "Refunds",
                  value: refunds,
                  color: "orange",
                  icon: "material-symbols:undo",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      icon={stat.icon}
                      className={`w-5 h-5 text-${stat.color}-600`}
                    />
                    <span className="text-sm text-gray-600">{stat.label}</span>
                  </div>
                  <div className={`text-xl font-bold text-${stat.color}-600`}>
                    GHS {stat.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800">
                  Transaction History
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              m.type === "in"
                                ? "bg-green-100 text-green-800"
                                : m.type === "out"
                                ? "bg-red-100 text-red-800"
                                : m.type === "sale"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {m.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          GHS {Number(m.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {m.reason || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {userMap[m.user_id] || m.user_id}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(m.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-6">
                <Icon
                  icon="material-symbols:lock"
                  className="w-6 h-6 text-orange-600"
                />
                <h4 className="text-lg font-semibold text-gray-800">
                  Close Register Session
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600">Expected Cash</div>
                    <div className="text-2xl font-bold text-blue-600">
                      GHS {expected.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Counted Cash
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="Enter counted amount"
                      value={closeAmount}
                      onChange={(e) => setCloseAmount(e.target.value)}
                      disabled={!canOperate}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-600 mb-2">Variance</div>
                  <div
                    className={`text-2xl font-bold ${
                      closeAmount
                        ? Number(closeAmount) - expected >= 0
                          ? "text-green-600"
                          : "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {closeAmount
                      ? `GHS ${(
                          Number(closeAmount) - expected
                        ).toLocaleString()}`
                      : "GHS 0.00"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {closeAmount && Number(closeAmount) - expected !== 0
                      ? Number(closeAmount) - expected > 0
                        ? "Over"
                        : "Short"
                      : "Balanced"}
                  </div>
                </div>
              </div>
              <button
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg py-4 font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
                onClick={handleCloseRegister}
                disabled={actionLoading || !closeAmount || !canOperate}
              >
                Close Register Session
              </button>
            </div>
            {showLargeOutConfirm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                  <Icon
                    icon="material-symbols:warning"
                    className="w-12 h-12 text-orange-500 mx-auto mb-4"
                  />
                  <h4 className="text-lg font-bold mb-2">Large Cash Out</h4>
                  <p className="mb-6 text-gray-600">
                    This is a large cash out. Are you sure you want to proceed?
                  </p>
                  <div className="flex gap-4">
                    <button
                      className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-lg py-2 font-semibold"
                      onClick={() => setShowLargeOutConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 font-semibold"
                      onClick={doCashOut}
                    >
                      Yes, Proceed
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200 text-center">
              <Icon
                icon="material-symbols:point-of-sale"
                className="w-16 h-16 text-blue-600 mx-auto mb-4"
              />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Open Cash Register
              </h3>
              <p className="text-gray-500 mb-6">
                Enter the starting cash amount to begin a new session.
              </p>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">
                  GHS
                </span>
                <input
                  type="number"
                  className="w-full border border-blue-200 rounded-lg px-12 py-4 ml-2 text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0.00"
                  value={openAmount}
                  onChange={(e) => setOpenAmount(e.target.value)}
                  disabled={!canOperate}
                />
              </div>
              <button
                className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg py-4 font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                onClick={handleOpenRegister}
                disabled={actionLoading || !openAmount || !canOperate}
              >
                {actionLoading ? (
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin w-5 h-5 mx-auto"
                  />
                ) : (
                  <>
                    Open Register
                    <Icon
                      icon="material-symbols:lock-open"
                      className="w-5 h-5 ml-2"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </SimpleModal>
  );
};

export default CashRegisterModal; 