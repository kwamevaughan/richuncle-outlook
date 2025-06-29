import { Icon } from "@iconify/react";

function toCSV(data) {
  if (!data.length) return "";
  const keys = Object.keys(data[0]);
  const rows = [keys.join(",")];
  for (const row of data) {
    rows.push(keys.map(k => JSON.stringify(row[k] ?? "")).join(","));
  }
  return rows.join("\n");
}

export default function CategoryCSVExport({ data, filename = "export.csv" }) {
  const handleExport = () => {
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      className="flex items-center gap-2 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs shadow"
      onClick={handleExport}
    >
      <Icon icon="mdi:file-export-outline" className="w-4 h-4" /> Export CSV
    </button>
  );
} 