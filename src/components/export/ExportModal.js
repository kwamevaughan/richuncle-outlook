"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { DragDropContext } from "@hello-pangea/dnd";
import FieldSelector from "./FieldSelector";
import FilterSection from "./FilterSection";
import PreviewTable from "./PreviewTable";
import useExportFilters from "../../hooks/useExportFilters";

// Utility function to format date to DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    // If the date is already in DD/MM/YYYY format, convert it
    if (dateString.includes("/")) {
      const [datePart] = dateString.split(",");
      const [day, month, year] = datePart.split("/");
      return `${day}-${month}-${year}`;
    }

    // Otherwise parse as ISO date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

export default function ExportModal({
  isOpen,
  onClose,
  users,
  mode,
  type = "users",
  stores = [],
  title,
  getFieldsOrder,
  getDefaultFields,
  onToggleType,
  zreportTab,
  animationDuration = 300
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle modal open/close with smooth transitions
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration]);
  // Field logic: use parent-provided for zreport, default for users
  const isZReport = type === "zreport";

  // Create dynamic field mapping based on data structure
  const createDynamicFields = (data) => {
    if (!data || data.length === 0) return [];

    const sampleItem = data[0];
    const fields = [];

    Object.keys(sampleItem).forEach((key) => {
      // Skip internal fields
      if (["id", "__typename"].includes(key)) return;

      // Create field mapping
      const field = {
        label: key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        key: key,
        icon: getFieldIcon(key),
      };
      fields.push(field);
    });

    return fields;
  };

  const getFieldIcon = (key) => {
    const iconMap = {
      name: "mdi:account",
      full_name: "mdi:account",
      email: "mdi:email",
      role: "mdi:account-badge",
      store_name: "mdi:store",
      warehouse_name: "mdi:warehouse",
      supplier_name: "mdi:truck",
      status: "mdi:check-circle",
      is_active: "mdi:check-circle",
      created_at: "mdi:calendar",
      updated_at: "mdi:update",
      last_login: "mdi:login",
      date: "mdi:calendar",
      total: "mdi:currency-usd",
      quantity: "mdi:numeric",
      price: "mdi:currency-usd",
      cost_price: "mdi:currency-usd",
      sku: "mdi:barcode",
      barcode: "mdi:barcode",
      purchase_number: "mdi:receipt",
      order_number: "mdi:clipboard-text",
      return_number: "mdi:undo-variant",
      transfer_number: "mdi:truck-delivery",
      notes: "mdi:note-text",
      phone: "mdi:phone",
      address: "mdi:map-marker",
      category_name: "mdi:folder",
      brand_name: "mdi:tag",
      unit_name: "mdi:ruler",
      tax_type: "mdi:percent",
      tax_percentage: "mdi:percent",
    };

    return iconMap[key] || "mdi:tag";
  };

  const fieldsOrder =
    typeof getFieldsOrder === "function"
      ? getFieldsOrder()
      : createDynamicFields(users);

  // Create default fields selection
  const createDefaultFields = (fields) => {
    const defaults = {};
    fields.forEach((field) => {
      // Default to true for most fields, false for some internal ones
      defaults[field.key] = !["updated_at", "created_at", "id"].includes(
        field.key,
      );
    });
    return defaults;
  };

  const defaultFields =
    typeof getDefaultFields === "function"
      ? getDefaultFields()
      : createDefaultFields(fieldsOrder);
  const [selectedFields, setSelectedFields] = useState(defaultFields);
  const [exportFormat, setExportFormat] = useState("csv");
  const [previewRows, setPreviewRows] = useState(3);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // For users, use filter logic; for zreport, just use users prop
  const {
    filterStatus,
    setFilterStatus,
    dateRange,
    setDateRange,
    filteredUsers,
  } = isZReport ? { filteredUsers: users } : useExportFilters(users);

  // Map store_id to store name
  const getStoreName = (store_id) => {
    if (!store_id) return "-";
    const store = stores.find((s) => s.id === store_id);
    return store ? store.name : "Unknown";
  };

  // Format the relevant fields for export
  let formattedUsers;
  if (isZReport) {
    formattedUsers = Array.isArray(filteredUsers) ? filteredUsers : [];
  } else {
    formattedUsers = filteredUsers.map((user) => {
      const formatted = { ...user };

      // Format common fields
      if (formatted.store_name === undefined && formatted.store_id) {
        formatted.store_name = getStoreName(formatted.store_id);
      }
      if (formatted.is_active !== undefined) {
        formatted.is_active = formatted.is_active ? "Active" : "Inactive";
      }
      if (formatted.created_at) {
        formatted.created_at = formatDate(formatted.created_at);
      }
      if (formatted.updated_at) {
        formatted.updated_at = formatDate(formatted.updated_at);
      }
      if (formatted.last_login) {
        formatted.last_login = formatDate(formatted.last_login);
      }
      if (formatted.date) {
        formatted.date = formatDate(formatted.date);
      }

      // Ensure all values are strings for CSV export
      const safeFormatted = {};
      for (const [key, value] of Object.entries(formatted)) {
        if (value === null || value === undefined) {
          safeFormatted[key] = "";
        } else if (typeof value === "object") {
          if (Array.isArray(value)) {
            safeFormatted[key] = `Array(${value.length})`;
          } else if (value && value.name) {
            safeFormatted[key] = value.name;
          } else {
            safeFormatted[key] = JSON.stringify(value);
          }
        } else {
          safeFormatted[key] = String(value);
        }
      }

      return safeFormatted;
    });
  }

  const statuses = ["all", "Active", "Inactive"];

  const fallbackStaticRanges = [
    {
      label: "All Time",
      range: () => ({ startDate: null, endDate: null }),
      isSelected: () => !dateRange[0].startDate,
    },
    {
      label: "Today",
      range: () => {
        const today = new Date();
        return { startDate: today, endDate: today };
      },
      isSelected: (range) =>
        range.startDate?.toDateString() === new Date().toDateString() &&
        range.endDate?.toDateString() === new Date().toDateString(),
    },
    {
      label: "Last 7 Days",
      range: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { startDate: start, endDate: end };
      },
      isSelected: (range) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return (
          range.startDate?.toDateString() === start.toDateString() &&
          range.endDate?.toDateString() === end.toDateString()
        );
      },
    },
  ];

  const handleFieldToggle = (key) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    setSelectedFields(
      Object.fromEntries(fieldsOrder.map((f) => [f.key, true])),
    );
    toast.success("All fields selected", { icon: "✅" });
  };

  const handleSelectNone = () => {
    setSelectedFields(
      Object.fromEntries(fieldsOrder.map((f) => [f.key, false])),
    );
    toast.success("All fields deselected", { icon: "✅" });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedFields = Array.from(fieldsOrder);
    const [movedField] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedField);
    setFieldsOrder(reorderedFields);
    toast.success("Fields reordered", { icon: "✅" });
  };

  const csvHeaders = fieldsOrder
    .filter((f) => selectedFields[f.key])
    .map((f) => ({
      label: f.label,
      key: f.key,
    }));

  const exportPDF = () => {
    const selectedKeys = fieldsOrder
      .filter((f) => selectedFields[f.key])
      .map((f) => f.key);
    if (selectedKeys.length === 0) {
      toast.error("Please select at least one field to export!", {
        icon: "⚠️",
      });
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(modalTitle || "Data Export", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    autoTable(doc, {
      head: [
        selectedKeys.map((key) => fieldsOrder.find((f) => f.key === key).label),
      ],
      body: formattedUsers.map((user) =>
        selectedKeys.map((key) => user[key] || "-"),
      ),
      startY: 30,
      theme: "striped",
      headStyles: { fillColor: [240, 93, 35] },
      styles: { textColor: mode === "dark" ? 255 : 35 },
    });

    doc.save(
      `${modalTitle?.toLowerCase().replace(/\s+/g, "_") || "data"}_export.pdf`,
    );
    toast.success("PDF exported successfully!", { icon: "✅" });
  };

  const handleExportClick = () => {
    if (Object.values(selectedFields).every((v) => !v)) {
      toast.error("Please select at least one field to export!", {
        icon: "⚠️",
      });
      return false;
    }
    toast.success("CSV exported successfully!", { icon: "✅" });
  };

  if (!shouldRender) return null;
  let modalTitle =
    title ||
    (isZReport
      ? "Export Z-Report Data"
      : type === "user"
        ? "Export User Data"
        : "Export Data");

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-black/30 backdrop-blur-sm flex flex-col items-center justify-start z-[9999]">
      <div
        className={`rounded-xl max-w-2xl w-full mx-0 shadow-2xl transform transition-all duration-${animationDuration} ease-out flex flex-col max-h-[80vh] backdrop-blur-md bg-white/95 border border-white/20 ${
          mode === "dark"
            ? "bg-gray-800/95 text-white border-gray-700/20"
            : "bg-white/95 text-[#231812] border-white/20"
        } ${
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <div className="bg-blue-800 rounded-t-xl p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Icon icon="mdi:export" className="w-8 h-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">{modalTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition duration-200"
          >
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>
        {/* Z-Report toggles */}
        {isZReport && (
          <div className="flex gap-4 px-6 pt-4">
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${
                zreportTab === "products"
                  ? "bg-blue-700 text-white"
                  : mode === "dark"
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => {
                if (typeof onToggleType === "function")
                  onToggleType("products");
              }}
            >
              Products Sold
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${
                zreportTab === "payments"
                  ? "bg-blue-700 text-white"
                  : mode === "dark"
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => {
                if (typeof onToggleType === "function")
                  onToggleType("payments");
              }}
            >
              Payment Breakdown
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-200 relative">
          <div className="p-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  className={`block text-sm font-medium ${
                    mode === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Select Fields to Export
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className={`text-xs px-2 py-1 rounded-full ${
                      mode === "dark"
                        ? "bg-gray-600 text-blue-300 hover:bg-gray-500 hover:text-blue-200"
                        : "bg-gray-200 text-blue-600 hover:bg-gray-300 hover:text-blue-700"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={handleSelectNone}
                    className={`text-xs px-2 py-1 rounded-full ${
                      mode === "dark"
                        ? "bg-gray-600 text-blue-300 hover:bg-gray-500 hover:text-blue-200"
                        : "bg-gray-200 text-blue-600 hover:bg-gray-300 hover:text-blue-700"
                    }`}
                  >
                    None
                  </button>
                </div>
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <FieldSelector
                  fieldsOrder={fieldsOrder}
                  selectedFields={selectedFields}
                  handleFieldToggle={handleFieldToggle}
                  mode={mode}
                />
              </DragDropContext>
            </div>
            {/* Only show filters for user export, not zreport */}
            {!isZReport && (
              <FilterSection
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                dateRange={dateRange}
                setDateRange={setDateRange}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
                mode={mode}
                statuses={statuses}
                fallbackStaticRanges={fallbackStaticRanges}
              />
            )}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  mode === "dark" ? "text-gray-200" : "text-gray-900"
                }`}
              >
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-sm ${
                  mode === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  mode === "dark" ? "text-gray-200" : "text-gray-900"
                }`}
              >
                Preview Rows
              </label>
              <select
                value={previewRows}
                onChange={(e) => setPreviewRows(Number(e.target.value))}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-sm ${
                  mode === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value={3}>3 Rows</option>
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
              </select>
              <PreviewTable
                filteredUsers={formattedUsers}
                csvHeaders={csvHeaders}
                previewRows={previewRows}
                mode={mode}
              />
            </div>
          </div>
        </div>
        <div
          className={`sticky bottom-0 p-4 border-t rounded-b-xl shadow-md ${
            mode === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-full flex items-center gap-2 transition duration-200 shadow-md hover:shadow-lg ${
                mode === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600 hover:text-white"
                  : " text-gray-700 hover:bg-gray-600 hover:text-gray-800"
              }`}
              style={{
                backgroundColor:
                  mode === "dark" ? "#374151!important" : "#e5e7eb!important",
                color: mode === "dark" ? "#fff!important" : "#374151!important",
              }}
            >
              <Icon icon="mdi:close" width={20} height={20} />
              Cancel
            </button>
            {exportFormat === "csv" ? (
              <CSVLink
                data={formattedUsers}
                headers={csvHeaders}
                filename={
                  isZReport
                    ? "zreport_export.csv"
                    : `${modalTitle?.toLowerCase().replace(/\s+/g, "_") || "data"}_export.csv`
                }
                onClick={handleExportClick}
                className={`px-6 py-2 rounded-full flex items-center gap-2 transition duration-200 shadow-md hover:shadow-lg ${
                  mode === "dark"
                    ? "bg-blue-800 text-white hover:bg-blue-600"
                    : "bg-blue-800 text-white hover:bg-blue-600"
                }`}
              >
                <Icon icon="mdi:download" width={20} height={20} />
                Export CSV
              </CSVLink>
            ) : (
              <button
                onClick={exportPDF}
                className={`px-6 py-2 rounded-full flex items-center gap-2 transition duration-200 shadow-md hover:shadow-lg ${
                  mode === "dark"
                    ? "bg-blue-800 text-white hover:bg-blue-600"
                    : "bg-blue-800 text-white hover:bg-blue-600"
                }`}
              >
                <Icon icon="mdi:download" width={20} height={20} />
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
