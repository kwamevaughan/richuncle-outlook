import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

// Session Duration Component - focused only on displaying session duration
const SessionDuration = ({ mode, selectedRegister, sessionRefreshKey }) => {
  const [session, setSession] = useState(null);
  const [duration, setDuration] = useState(0);

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
    <div
      className={
        `flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ` +
        (mode === "dark"
          ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
          : "bg-white/80 text-gray-700 hover:bg-white/95") +
        " backdrop-blur-sm border border-white/20 flex-shrink-0"
      }
    >
      <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">
        <span className="inline">Session Duration: </span>
        <Icon
          icon="mdi:clock-outline"
          className={`h-3 w-3 sm:h-4 sm:w-4 inline ${
            mode === "dark" ? "text-green-400" : "text-green-600"
          }`}
        />{" "}
        <span className="text-xs sm:text-sm font-normal">
          {session ? formatDuration(duration) : "No session"}
        </span>
      </span>
    </div>
  );
};

export default SessionDuration;
