import { useEffect, useState, useMemo } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import { useUser } from "../hooks/useUser";
import { useRouter } from "next/router";
import SimpleModal from "@/components/SimpleModal";
import toast from "react-hot-toast";
import TooltipIconButton from "@/components/TooltipIconButton";
import ExportModal from "@/components/export/ExportModal";
import { GenericTable } from "@/components/GenericTable";
import useLogout from "../hooks/useLogout";
import ZReportView from "@/components/ZReportView";
import printZReport from "@/components/printZReport";
import { format, parseISO, isWithinInterval } from 'date-fns';

const PAGE_SIZE = 10;

export default function RegistersPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const router = useRouter();
  const [registers, setRegisters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [forceCloseLoading, setForceCloseLoading] = useState(null);
  const [forceCloseSession, setForceCloseSession] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({});
  const { handleLogout } = useLogout();
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [zReportLoading, setZReportLoading] = useState(false);
  const [zReportError, setZReportError] = useState("");
  const [zReportData, setZReportData] = useState(null);
  const [showZReportPreview, setShowZReportPreview] = useState(false);

  // Session History modal filters and pagination
  const [sessionPage, setSessionPage] = useState(1);
  const SESSION_PAGE_SIZE = 10;
  const [sessionStatusFilter, setSessionStatusFilter] = useState('');
  const [sessionCashierFilter, setSessionCashierFilter] = useState('');
  const [sessionDateRange, setSessionDateRange] = useState([null, null]);

  // Only allow admin/manager
  useEffect(() => {
    if (!userLoading && user && !["admin", "manager"].includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, userLoading]);

  // Fetch users for userMap
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setUsers(res.data);
          const map = {};
          res.data.forEach(u => { map[u.id] = u.full_name || u.email || u.id; });
          setUserMap(map);
        }
      });
  }, []);

  // Fetch registers, sessions, and stores
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [regRes, sessRes, storeRes] = await Promise.all([
        fetch("/api/registers").then((r) => r.json()),
        fetch("/api/cash-register-sessions").then((r) => r.json()),
        fetch("/api/stores").then((r) => r.json()),
      ]);
      if (regRes.success) setRegisters(regRes.data || []);
      if (sessRes.success) setSessions(sessRes.data || []);
      if (storeRes.success) setStores(storeRes.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load registers, sessions, or stores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Map registerId -> open session
  const openSessionsMap = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      if (s.status === "open") map[s.register_id] = s;
    });
    return map;
  }, [sessions]);

  // Map registerId -> all sessions
  const sessionsByRegister = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      if (!map[s.register_id]) map[s.register_id] = [];
      map[s.register_id].push(s);
    });
    return map;
  }, [sessions]);

  // StoreId -> Store Name
  const storeNameMap = useMemo(() => {
    const map = {};
    stores.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [stores]);

  // Filtered and searched registers
  const filteredRegisters = useMemo(() => {
    let regs = registers;
    if (search) {
      regs = regs.filter(r => (r.name || "").toLowerCase().includes(search.toLowerCase()));
    }
    if (statusFilter) {
      regs = regs.filter(r => {
        const open = openSessionsMap[r.id];
        return statusFilter === "open" ? !!open : !open;
      });
    }
    if (storeFilter) {
      regs = regs.filter(r => String(r.store_id) === String(storeFilter));
    }
    return regs;
  }, [registers, search, statusFilter, storeFilter, openSessionsMap]);

  // Pagination
  const totalPages = Math.ceil(filteredRegisters.length / PAGE_SIZE) || 1;
  const pagedRegisters = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRegisters.slice(start, start + PAGE_SIZE);
  }, [filteredRegisters, page]);

  // Summary
  const total = registers.length;
  const open = registers.filter(r => openSessionsMap[r.id]).length;
  const closed = total - open;
  // Find the most recent closed session
  const lastClosedSession = useMemo(() => {
    const closedSessions = sessions.filter(s => s.status === 'closed' && s.closed_at);
    if (closedSessions.length === 0) return null;
    return closedSessions.reduce((latest, curr) => {
      return new Date(curr.closed_at) > new Date(latest.closed_at) ? curr : latest;
    });
  }, [sessions]);
  const lastClosedTime = lastClosedSession ? new Date(lastClosedSession.closed_at).toLocaleString() : null;

  // ExportModal fields for registers
  const registerFieldsOrder = [
    { label: "Register", key: "name", icon: "mdi:cash-register" },
    { label: "Store", key: "store_name", icon: "mdi:store" },
    { label: "Status", key: "status", icon: "mdi:check-circle" },
    { label: "Opened By", key: "opened_by", icon: "mdi:account" },
    { label: "Opened At", key: "opened_at", icon: "mdi:clock" },
  ];
  const getRegisterDefaultFields = () => ({
    name: true,
    store_name: true,
    status: true,
    opened_by: true,
    opened_at: true,
  });
  // Prepare data for export
  const exportRegisters = filteredRegisters.map(r => {
    const openSession = openSessionsMap[r.id];
    return {
      name: r.name || r.id,
      store_name: storeNameMap[r.store_id] || r.store_name || r.store_id || "-",
      status: openSession ? "Open" : "Closed",
      opened_by: openSession ? (userMap[openSession.user_id] || openSession.user_id) : "-",
      opened_at: openSession ? (openSession.opened_at ? new Date(openSession.opened_at).toLocaleString() : "-") : "-",
    };
  });

  const handleForceClose = (session) => {
    setForceCloseSession(session);
  };

  const confirmForceClose = async () => {
    if (!forceCloseSession) return;
    setForceCloseLoading(forceCloseSession.id);
    try {
      const res = await fetch(`/api/cash-register-sessions/${forceCloseSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed", force: true }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Session force-closed");
        fetchAll();
        setForceCloseSession(null);
      } else {
        toast.error(result.error || "Failed to force close session");
      }
    } catch (err) {
      toast.error("Failed to force close session");
    } finally {
      setForceCloseLoading(null);
    }
  };

  if (userLoading && LoadingComponent) return <LoadingComponent />;
  if (!user) return null;

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-col flex-1">
        <div className="py-2">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Icon
                icon="mdi:cash-register"
                className="w-7 h-7 text-blue-900"
              />
              Registers
            </h1>
            <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 justify-between">
              View and manage all registers here. Use the POS to create a new
              register.
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => router.push("/pos/")}
              >
                <Icon icon="mdi:plus" className="inline-block mr-2" /> New
                Register
              </button>
            </div>
          </div>
        </div>
        {/* Summary Bar */}
        <div className="flex flex-wrap gap-4 mb-4 justify-between items-center align-middle">
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded shadow-sm">
              <Icon
                icon="mdi:cash-register"
                className="w-5 h-5 text-blue-700"
              />
              <span className="font-semibold text-blue-900">
                Total: {total}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded shadow-sm">
              <Icon
                icon="mdi:check-circle"
                className="w-5 h-5 text-green-700"
              />
              <span className="font-semibold text-green-900">Open: {open}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded shadow-sm">
              <Icon icon="mdi:close-circle" className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">
                Closed: {closed}
              </span>
            </div>
            {lastClosedTime && (
              <TooltipIconButton
                icon="mdi:clock-outline"
                label={`Last Closed: ${lastClosedTime}${lastClosedSession && userMap[lastClosedSession.user_id] ? `\nBy: ${userMap[lastClosedSession.user_id]}` : ''}`}
                mode={mode}
                className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded shadow-sm text-yellow-900 font-semibold"
                style={{ minWidth: 0 }}
              >
                <Icon icon="mdi:clock-outline" className="w-5 h-5 text-yellow-700" />
                <span className="font-semibold text-yellow-900">Last Closed: {lastClosedTime}</span>
              </TooltipIconButton>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap w-full">
                <input
                  type="text"
                  placeholder="Search register..."
                  className="border rounded px-3 py-1.5 text-sm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                <select
                  className="border rounded px-2 py-1.5 text-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  className="border rounded px-2 py-1.5 text-sm"
                  value={storeFilter}
                  onChange={(e) => {
                    setStoreFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Stores</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-12">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-100 rounded-xl h-24 w-full"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow border bg-white">
            <GenericTable
              data={pagedRegisters}
              columns={[
                {
                  header: "Register",
                  accessor: "name",
                  render: (row) => (
                    <span className="flex items-center gap-2 font-semibold text-gray-900">
                      <Icon
                        icon="mdi:cash-register"
                        className="w-5 h-5 text-blue-700"
                      />
                      {row.name || row.id}
                    </span>
                  ),
                },
                {
                  header: "Store",
                  accessor: "store_id",
                  render: (row) =>
                    storeNameMap[row.store_id] ||
                    row.store_name ||
                    row.store_id ||
                    "-",
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (row) => {
                    const openSession = openSessionsMap[row.id];
                    return openSession ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold"
                        title="Open"
                      >
                        <Icon icon="mdi:check-circle" className="w-4 h-4" />{" "}
                        Open
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-200 text-gray-600 text-xs font-semibold"
                        title="Closed"
                      >
                        <Icon icon="mdi:close-circle" className="w-4 h-4" />{" "}
                        Closed
                      </span>
                    );
                  },
                },
                {
                  header: "Current Session",
                  accessor: "current_session",
                  render: (row) => {
                    const openSession = openSessionsMap[row.id];
                    return openSession ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-700">
                          Opened by:{" "}
                          <span className="font-semibold">
                            {userMap[openSession.user_id] ||
                              openSession.user_id}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {openSession.opened_at
                            ? new Date(openSession.opened_at).toLocaleString()
                            : "-"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No open session
                      </span>
                    );
                  },
                },
              ]}
              actions={[
                {
                  label: "View Session History",
                  icon: "mdi:history",
                  onClick: (row) => {
                    setSelectedRegister(row);
                    setShowSessionModal(true);
                  },
                  render: (row) => (
                    <TooltipIconButton
                      icon="mdi:history"
                      label="View Session History"
                      onClick={() => {
                        setSelectedRegister(row);
                        setShowSessionModal(true);
                      }}
                      mode={mode}
                      className="bg-green-50 text-green-600 text-xs"
                    />
                  ),
                },
                {
                  label: "Force Close Session",
                  icon: (row) => {
                    const openSession = openSessionsMap[row.id];
                    return forceCloseLoading === (openSession && openSession.id)
                      ? "mdi:loading"
                      : "mdi:close-circle";
                  },
                  onClick: (row) => {
                    const openSession = openSessionsMap[row.id];
                    if (openSession) handleForceClose(openSession);
                  },
                  show: (row) =>
                    !!openSessionsMap[row.id] && user.role === "admin",
                  render: (row) => {
                    const openSession = openSessionsMap[row.id];
                    const isLoading =
                      forceCloseLoading === (openSession && openSession.id);
                    return (
                      <TooltipIconButton
                        icon={isLoading ? "mdi:loading" : "mdi:close-circle"}
                        label="Force Close Session"
                        onClick={() => {
                          if (openSession) handleForceClose(openSession);
                        }}
                        mode={mode}
                        className={`bg-red-50 text-red-600 text-xs ${
                          isLoading ? "animate-spin" : ""
                        }`}
                        disabled={isLoading}
                      />
                    );
                  },
                },
              ]}
              pageSize={PAGE_SIZE}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              totalItems={filteredRegisters.length}
              emptyMessage="No registers found"
              selectable={false}
              searchable={false}
            />
          </div>
        )}
      </div>
      {/* Session History Modal */}
      {showSessionModal && selectedRegister && (
        <SimpleModal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title={`Session History: ${
            selectedRegister.name || selectedRegister.id
          }`}
          width="max-w-2xl"
        >
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <select
              className="border rounded px-2 py-1.5 text-sm"
              value={sessionStatusFilter}
              onChange={(e) => {
                setSessionStatusFilter(e.target.value);
                setSessionPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <select
              className="border rounded px-2 py-1.5 text-sm"
              value={sessionCashierFilter}
              onChange={(e) => {
                setSessionCashierFilter(e.target.value);
                setSessionPage(1);
              }}
            >
              <option value="">All Cashiers</option>
              {Object.entries(userMap).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border rounded px-2 py-1.5 text-sm"
              value={sessionDateRange[0] || ""}
              onChange={(e) => {
                setSessionDateRange([e.target.value, sessionDateRange[1]]);
                setSessionPage(1);
              }}
              placeholder="Start date"
              title="Start date"
            />
            <span>-</span>
            <input
              type="date"
              className="border rounded px-2 py-1.5 text-sm"
              value={sessionDateRange[1] || ""}
              onChange={(e) => {
                setSessionDateRange([sessionDateRange[0], e.target.value]);
                setSessionPage(1);
              }}
              placeholder="End date"
              title="End date"
            />
          </div>
          {/* Filtered and paginated sessions */}
          {(() => {
            let sessionsList = sessionsByRegister[selectedRegister.id] || [];
            if (sessionStatusFilter) {
              sessionsList = sessionsList.filter(
                (sess) => sess.status === sessionStatusFilter
              );
            }
            if (sessionCashierFilter) {
              sessionsList = sessionsList.filter(
                (sess) => sess.user_id === sessionCashierFilter
              );
            }
            if (sessionDateRange[0]) {
              sessionsList = sessionsList.filter((sess) => {
                const opened = sess.opened_at ? parseISO(sess.opened_at) : null;
                return opened && opened >= parseISO(sessionDateRange[0]);
              });
            }
            if (sessionDateRange[1]) {
              sessionsList = sessionsList.filter((sess) => {
                const closed = sess.closed_at ? parseISO(sess.closed_at) : null;
                return closed && closed <= parseISO(sessionDateRange[1]);
              });
            }
            const totalSessionPages =
              Math.ceil(sessionsList.length / SESSION_PAGE_SIZE) || 1;
            const pagedSessions = sessionsList.slice(
              (sessionPage - 1) * SESSION_PAGE_SIZE,
              sessionPage * SESSION_PAGE_SIZE
            );
            return (
              <>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Cashier</th>
                      <th className="px-4 py-2 text-left">Opened At</th>
                      <th className="px-4 py-2 text-left">Closed At</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSessions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-400"
                        >
                          No sessions found
                        </td>
                      </tr>
                    ) : (
                      pagedSessions.map((sess) => (
                        <tr
                          key={sess.id}
                          className="border-b hover:bg-gray-50 transition-all"
                        >
                          <td className="px-4 py-2">
                            {sess.status === "open" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                                <Icon
                                  icon="mdi:check-circle"
                                  className="w-4 h-4"
                                />{" "}
                                Open
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-200 text-gray-600 text-xs font-semibold">
                                <Icon
                                  icon="mdi:close-circle"
                                  className="w-4 h-4"
                                />{" "}
                                Closed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {userMap[sess.user_id] || sess.user_id}
                          </td>
                          <td className="px-4 py-2">
                            {sess.opened_at
                              ? format(
                                  parseISO(sess.opened_at),
                                  "yyyy-MM-dd HH:mm"
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-2">
                            {sess.closed_at
                              ? format(
                                  parseISO(sess.closed_at),
                                  "yyyy-MM-dd HH:mm"
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              className="text-blue-700 hover:underline text-xs font-semibold"
                              title="View Z-Report"
                              onClick={async () => {
                                setShowZReportModal(true);
                                setZReportLoading(true);
                                setZReportError("");
                                setZReportData(null);
                                try {
                                  const res = await fetch(
                                    `/api/cash-register-sessions/${sess.id}/z-report`
                                  );
                                  const json = await res.json();
                                  if (json.success) setZReportData(json.data);
                                  else
                                    setZReportError(
                                      json.error || "Failed to fetch Z-Report"
                                    );
                                } catch (err) {
                                  setZReportError("Failed to fetch Z-Report");
                                } finally {
                                  setZReportLoading(false);
                                }
                              }}
                            >
                              Z-Report
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Pagination */}
                <div className="flex justify-between items-center py-4 px-2">
                  <span className="text-xs text-gray-500">
                    Showing{" "}
                    {sessionsList.length === 0
                      ? 0
                      : SESSION_PAGE_SIZE * (sessionPage - 1) + 1}
                    -
                    {Math.min(
                      SESSION_PAGE_SIZE * sessionPage,
                      sessionsList.length
                    )}{" "}
                    of {sessionsList.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                      onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                      disabled={sessionPage === 1}
                      title="Previous Page"
                    >
                      Prev
                    </button>
                    <span className="text-xs font-semibold">
                      Page {sessionPage} of {totalSessionPages}
                    </span>
                    <button
                      className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                      onClick={() =>
                        setSessionPage((p) =>
                          Math.min(totalSessionPages, p + 1)
                        )
                      }
                      disabled={sessionPage === totalSessionPages}
                      title="Next Page"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </SimpleModal>
      )}
      {/* Force Close Confirmation Modal */}
      {forceCloseSession && (
        <SimpleModal
          isOpen={!!forceCloseSession}
          onClose={() => setForceCloseSession(null)}
          title="Force Close Session?"
          width="max-w-md"
        >
          <div className="p-2">
            <p className="text-gray-600 mb-6">
              Are you sure you want to force close this session? This should
              only be used if the register cannot be closed normally.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setForceCloseSession(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700"
                disabled={forceCloseLoading === forceCloseSession.id}
              >
                Cancel
              </button>
              <button
                onClick={confirmForceClose}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded"
                disabled={forceCloseLoading === forceCloseSession.id}
              >
                {forceCloseLoading === forceCloseSession.id
                  ? "Closing..."
                  : "Force Close"}
              </button>
            </div>
          </div>
        </SimpleModal>
      )}
      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          users={exportRegisters}
          mode={mode}
          type="registers"
          title="Export Registers Data"
          getFieldsOrder={() => registerFieldsOrder}
          getDefaultFields={getRegisterDefaultFields}
          stores={stores}
        />
      )}
      {/* Z-Report Modal */}
      {showZReportModal && (
        <SimpleModal
          isOpen={showZReportModal}
          onClose={() => setShowZReportModal(false)}
          title="Z-Report"
          width="max-w-3xl"
        >
          {zReportLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : zReportError ? (
            <div className="text-center py-12 text-red-500">{zReportError}</div>
          ) : (
            <>
              <ZReportView zReport={zReportData} showPrintButton={false} />
              <div className="flex gap-4 mt-6">
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  onClick={() => printZReport(zReportData)}
                >
                  <Icon icon="material-symbols:print" className="w-5 h-5" />{" "}
                  Print
                </button>
                <button
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  onClick={() => setShowZReportPreview(true)}
                >
                  <Icon icon="mdi:eye-outline" className="w-5 h-5" /> Print
                  Preview
                </button>
              </div>
            </>
          )}
        </SimpleModal>
      )}

      {/* Z-Report Print Preview Modal */}
      {showZReportPreview && (
        <SimpleModal
          isOpen={showZReportPreview}
          onClose={() => setShowZReportPreview(false)}
          title="Z-Report Print Preview"
          width="max-w-3xl"
        >
          <div className="bg-white p-6 rounded-xl shadow max-w-2xl mx-auto">
            {/* Render the print HTML as innerHTML for preview */}
            <div
              className="border border-gray-200 rounded overflow-auto"
              style={{ background: "#fff" }}
              dangerouslySetInnerHTML={{
                __html: printZReport.__previewHtml
                  ? printZReport.__previewHtml(zReportData)
                  : printZReport(zReportData, true),
              }}
            />
            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                onClick={() => printZReport(zReportData)}
              >
                <Icon icon="material-symbols:print" className="w-5 h-5" /> Print
              </button>
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                onClick={() => setShowZReportPreview(false)}
              >
                <Icon icon="mdi:close" className="w-5 h-5" /> Close Preview
              </button>
            </div>
          </div>
        </SimpleModal>
      )}
    </MainLayout>
  );
} 