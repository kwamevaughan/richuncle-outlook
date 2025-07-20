import { useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { addDays, startOfMonth, endOfMonth, subDays, subMonths, startOfYesterday, endOfYesterday } from "date-fns";

const quickRanges = [
  { label: "Today", getRange: () => {
    const today = new Date();
    return { startDate: today, endDate: today };
  }},
  { label: "Yesterday", getRange: () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return { startDate: y, endDate: y };
  }},
  { label: "Last 7 Days", getRange: () => {
    const end = new Date();
    const start = subDays(end, 6);
    return { startDate: start, endDate: end };
  }},
  { label: "Last 30 Days", getRange: () => {
    const end = new Date();
    const start = subDays(end, 29);
    return { startDate: start, endDate: end };
  }},
  { label: "This Month", getRange: () => {
    const now = new Date();
    return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }},
  { label: "Last Month", getRange: () => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
  }},
  { label: "Custom Range", getRange: null },
];

export default function DateRangePicker({ value, onChange, className = "", hideDropdown = false }) {
  // Default to Today
  const [selected, setSelected] = useState("Today");
  const [range, setRange] = useState(() => {
    const today = new Date();
    return { startDate: today, endDate: today, key: "selection" };
  });

  const handleDropdown = (e) => {
    const label = e.target.value;
    setSelected(label);
    if (label !== "Custom Range") {
      const quick = quickRanges.find((q) => q.label === label);
      if (quick && quick.getRange) {
        const { startDate, endDate } = quick.getRange();
        setRange({ startDate, endDate, key: "selection" });
        if (onChange) onChange({ startDate, endDate, label });
      }
    } else {
      // Custom Range: don't call onChange until user picks
    }
  };

  const handleRangeChange = (ranges) => {
    // Support both array and object shapes
    let sel = null;
    if (Array.isArray(ranges)) {
      // Sometimes react-date-range passes an array
      sel = ranges[0];
    } else if (ranges && typeof ranges === 'object' && ranges.selection) {
      sel = ranges.selection;
    } else if (ranges && typeof ranges === 'object') {
      // Fallback: try first value
      sel = Object.values(ranges)[0];
    }
    if (!sel) return;
    setRange(sel);
    if (onChange) onChange({ startDate: sel.startDate, endDate: sel.endDate, label: "Custom Range" });
  };

  if (hideDropdown) {
    return (
      <div className={className}>
        <DateRange
          ranges={[value || range]}
          onChange={handleRangeChange}
          moveRangeOnFirstSelection={false}
          showDateDisplay={true}
          rangeColors={["#2563eb"]}
          showMonthAndYearPickers={true}
          showPreview={false}
          editableDateInputs={true}
          maxDate={new Date()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={selected}
        onChange={handleDropdown}
      >
        {quickRanges.map((q) => (
          <option key={q.label} value={q.label}>{q.label}</option>
        ))}
      </select>
      {selected === "Custom Range" && (
        <div className="mt-2">
          <DateRange
            ranges={[range]}
            onChange={handleRangeChange}
            moveRangeOnFirstSelection={false}
            showDateDisplay={true}
            rangeColors={["#2563eb"]}
            showMonthAndYearPickers={true}
            showPreview={false}
            editableDateInputs={true}
            maxDate={new Date()}
          />
        </div>
      )}
    </div>
  );
} 