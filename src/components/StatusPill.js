import React from "react";

const STATUS_COLORS = {
  Completed: "bg-green-100 text-green-800 border-green-200",
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
  Refunded: "bg-blue-100 text-blue-800 border-blue-200",
  default: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function StatusPill({ status }) {
  const label = status || "Completed";
  const color = STATUS_COLORS[label] || STATUS_COLORS.default;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${color}`}
      style={{ minWidth: 80, textAlign: "center" }}
    >
      {label}
    </span>
  );
} 