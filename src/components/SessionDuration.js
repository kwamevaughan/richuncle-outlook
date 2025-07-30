import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

// Session Duration Component with Register Selector
const SessionDuration = ({ mode, user, sessionRefreshKey }) => {
  const [registers, setRegisters] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [session, setSession] = useState(null);
  const [duration, setDuration] = useState(0);
  // Fetch registers on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/registers");
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          let filtered = data.data;
          if (user?.role === 'cashier' && user?.store_id) {
            filtered = data.data.filter(r => r.store_id === user.store_id);
          }
          setRegisters(filtered);
          // Auto-select the register for the cashier's store
          if (filtered.length > 0) {
            setSelectedRegister(filtered[0].id);
          }
        }
      } catch (err) {
        setRegisters([]);
      }
    })();
  }, [user]);

  // Persist selected register
  useEffect(() => {
    if (selectedRegister) {
      localStorage.setItem("pos_selected_register", selectedRegister);
    }
  }, [selectedRegister]);

  // Fetch open session for selected register
  useEffect(() => {
    if (!selectedRegister) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/cash-register-sessions?status=open&register_id=${selectedRegister}`
        );
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setSession(data.data[0]);
        } else {
          setSession(null);
        }
      } catch (err) {
        setSession(null);
      }
    })();
  }, [selectedRegister, sessionRefreshKey]);

  // Update duration every second
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setDuration(
        Math.floor((Date.now() - new Date(session.opened_at).getTime()) / 1000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full">
      <select
        className={`border rounded px-2 py-1 text-xs sm:text-sm flex-shrink-0 ${
          mode === "dark"
            ? "bg-gray-800 text-white border-gray-700"
            : "bg-white text-gray-900 border-gray-300"
        }`}
        value={selectedRegister || ""}
        onChange={(e) => setSelectedRegister(e.target.value)}
        style={{ minWidth: '200px', maxWidth: '250px' }}
        disabled={user?.role === 'cashier'}
      >
        {registers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name || `Register ${r.id}`}
          </option>
        ))}
      </select>

      <div
        className={
          `flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ` +
          (mode === "dark"
            ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
            : "bg-white/80 text-gray-700 hover:bg-white/95") +
          " backdrop-blur-sm border border-white/20 flex-shrink-0"
        }
        disabled
      >
        <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">
          <span className="inline">Session Duration: </span>
          <Icon
            icon="mdi:clock-outline"
            className={`h-3 w-3 sm:h-4 sm:w-4 inline ${
              mode === "dark" ? "text-green-400" : "text-green-600"
            }`}
          />
          {" "}
          <span className="text-xs sm:text-sm font-normal">
            {session ? formatDuration(duration) : "No session"}
          </span>
        </span>
      </div>
    </div>
  );
};

export default SessionDuration;