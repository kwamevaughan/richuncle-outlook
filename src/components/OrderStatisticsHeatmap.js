import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

const HOURS = [
  "2 Am",
  "4 Am",
  "6 Am",
  "8 Am",
  "10 Am",
  "12 Am",
  "14 Pm",
  "16 Pm",
  "18 Am",
];
const HOUR_TO_INDEX = {
  2: 0,
  4: 1,
  6: 2,
  8: 3,
  10: 4,
  12: 5,
  14: 6,
  16: 7,
  18: 8,
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PERIODS = ["Today", "Weekly", "Monthly"];

const getCellColor = (value, max) => {
  if (!value) return "#FDEAD7";
  if (max <= 1) return "#FDBA74";
  const percent = value / max;
  if (percent > 0.8) return "#F97316";
  if (percent > 0.5) return "#FDBA74";
  if (percent > 0.2) return "#FDEAD7";
  return "#FDEAD7";
};

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  return new Date(d.setDate(diff));
}

function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function OrderStatisticsHeatmap({ selectedStore }) {
  const [period, setPeriod] = useState("Today");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [data, setData] = useState(
    Array(9)
      .fill(0)
      .map(() => Array(7).fill(0))
  );
  const [max, setMax] = useState(1);
  const [hovered, setHovered] = useState(null); // {row, col, x, y}
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const gridRef = useRef();

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (!json.success) return;
      const orders = json.data || [];
      const now = new Date();
      let start, end;
      if (period === "Today") {
        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        );
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
      } else if (period === "Weekly") {
        start = getStartOfWeek(now);
        end = now;
      } else if (period === "Monthly") {
        start = getStartOfMonth(now);
        end = now;
      }
      // Filter orders by period and store
      const filteredOrders = orders.filter((o) => {
        if (!o.timestamp) return false;
        if (selectedStore && String(o.store_id) !== String(selectedStore))
          return false;
        const d = new Date(o.timestamp);
        return d >= start && d <= end;
      });
      // Build grid: [hour][day]
      const grid = Array(9)
        .fill(0)
        .map(() => Array(7).fill(0));
      filteredOrders.forEach((o) => {
        const d = new Date(o.timestamp);
        const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        const hour = d.getHours();
        let slot = null;
        for (const h of [2, 4, 6, 8, 10, 12, 14, 16, 18]) {
          if (hour < h + 2) {
            slot = h;
            break;
          }
        }
        if (slot && HOUR_TO_INDEX[slot] !== undefined) {
          grid[HOUR_TO_INDEX[slot]][dayIdx]++;
        }
      });
      setData(grid);
      setMax(Math.max(1, ...grid.flat()));
    }
    fetchData();
  }, [period, selectedStore]);

  // Tooltip positioning
  function handleMouseEnter(e, row, col) {
    const rect = e.target.getBoundingClientRect();
    setHovered({ row, col });
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }
  function handleMouseMove(e) {
    const rect = e.target.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }
  function handleMouseLeave() {
    setHovered(null);
  }

  return (
    <div className="bg-white rounded-2xl shadow p-0 w-full max-w-xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="bg-violet-100 p-2 rounded-lg">
            <Icon icon="mdi:cube-outline" className="text-violet-600 text-lg" />
          </span>
          <span className="font-bold text-lg">Order Statistics</span>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1 border px-3 py-1.5 rounded-lg text-gray-700 bg-white text-sm font-medium shadow-sm"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <Icon icon="mdi:calendar" className="text-lg mr-1" />
            {period}
            <Icon icon="mdi:chevron-down" className="text-lg ml-1" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    period === p ? "font-bold text-blue-600" : "text-gray-700"
                  }`}
                  onClick={() => {
                    setPeriod(p);
                    setDropdownOpen(false);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="px-6 py-6">
        <div
          className="overflow-x-auto"
          ref={gridRef}
          style={{ position: "relative" }}
        >
          <div className="grid grid-cols-8 gap-[6px] mb-1">
            <div></div>
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-xs font-semibold text-gray-500 text-center py-1"
              >
                {d}
              </div>
            ))}
          </div>
          {HOURS.map((hour, i) => (
            <div
              key={hour}
              className="grid grid-cols-8 gap-[6px] items-center mb-1"
            >
              <div
                className="text-xs font-semibold text-gray-500 text-right pr-2"
                style={{ minWidth: 36 }}
              >
                {hour}
              </div>
              {DAYS.map((_, j) => (
                <div
                  key={j}
                  className="rounded-md transition-all duration-200 border border-white cursor-pointer"
                  style={{
                    background: getCellColor(data[i][j], max),
                    width: 36,
                    height: 36,
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, i, j)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                ></div>
              ))}
            </div>
          ))}
          {/* Tooltip */}
          {hovered && (
            <div
              style={{
                position: "fixed",
                left: tooltipPos.x,
                top: tooltipPos.y - 48,
                transform: "translate(-50%, -8px)",
                zIndex: 50,
                pointerEvents: "none",
                transition:
                  "left 0.18s cubic-bezier(.4,1,.7,1), top 0.18s cubic-bezier(.4,1,.7,1)",
              }}
            >
              <div className="uppercase bg-white rounded-xl shadow-lg px-4 py-2 text-gray-900 text-base font-semibold flex flex-col items-center relative">
                <span>
                  {HOURS[hovered.row]}:{" "}
                  <span className="font-bold">
                    {data[hovered.row][hovered.col]}
                  </span>
                </span>
                {/* Arrow */}
                <span className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-4 h-4">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 16L0 8H16L8 16Z" fill="#fff" />
                    <path d="M8 16L0 8H16L8 16Z" fill="#fff" />
                    <path
                      d="M8 16L0 8H16L8 16Z"
                      fill="#e5e7eb"
                      fillOpacity="0.2"
                    />
                  </svg>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
