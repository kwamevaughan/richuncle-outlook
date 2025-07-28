import React, { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import CategoryDragDrop from "./CategoryDragDrop";
import CategoryInlineEdit from "./CategoryInlineEdit";
import Image from "next/image";
import CategoryCSVExport from "./CategoryCSVExport";
import CategoryCSVImport from "./CategoryCSVImport";
import { DateRange } from 'react-date-range';
import { format, parseISO, isWithinInterval } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import ReactDOM from 'react-dom';
import TooltipIconButton from "./TooltipIconButton";
import ExportModal from "./export/ExportModal";
import toast from "react-hot-toast";

// Enhanced useTable hook
function useTable(data, initialPageSize = 10, statusOptions = null) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Filtering
  const filteredData = useMemo(() => {
    let result = data;
    // Status filter for sales returns
    if (statusFilter && statusFilter !== "all" && statusOptions) {
      result = result.filter(row => row.status === statusFilter);
    }
    // Search filter
    if (searchTerm) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    // Date filters for sortBy
    if (sortBy === "last_month") {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      result = result.filter(row => row.created_at && new Date(row.created_at) >= lastMonth);
    } else if (sortBy === "last_7_days") {
      const now = new Date();
      const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(row => row.created_at && new Date(row.created_at) >= last7);
    }
    return result;
  }, [data, searchTerm, statusFilter, sortBy, statusOptions]);

  // Sorting
  const sortedData = useMemo(() => {
    if (sortBy === "recent") {
      return [...filteredData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "asc") {
      return [...filteredData].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "desc") {
      return [...filteredData].sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }
    // Default to filteredData
    return filteredData;
  }, [filteredData, sortBy]);

  // Column sorting
  const columnSortedData = useMemo(() => {
    if (!sortKey) return sortedData;
    
    return [...sortedData].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDir === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle date values
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDir === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string values (including dates as strings)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDir === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [sortedData, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paged = columnSortedData.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePage = (newPage) => {
    setPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(
      selected.length === paged.length ? [] : paged.map((row) => row.id)
    );
  };

  return {
    paged,
    page,
    pageSize,
    totalPages,
    sortKey,
    sortDir,
    selected,
    searchTerm,
    setPage,
    setPageSize,
    handleSort,
    handlePage,
    toggleSelect,
    selectAll,
    setSearchTerm,
    totalItems: columnSortedData.length,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
  };
}

export function GenericTable({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onReorder,
  onAddNew,
  addNewLabel = "Add New",
  title,
  emptyMessage = "No data available",
  selectable = true,
  searchable = true,
  enableDragDrop = false,
  actions = [],
  onImport,
  customRowRender,
  importType,
  enableDateFilter = true,
  onExport,
  exportType = "default",
  exportTitle,
  stores = [],
  statusOptions = null,
  onRefresh,
  getFieldsOrder,
  getDefaultFields,
  mode = "light",
}) {
  // Ensure data is an array and filter out any null/undefined items
  const safeData = Array.isArray(data) ? data.filter(item => item != null) : [];
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);
  const datePickerRef = useRef();
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef();
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  // Filter data by date range
  const filteredByDate = useMemo(() => {
    if (!enableDateFilter) return safeData;
    const { startDate, endDate } = dateRange[0] || {};
    if (!startDate || !endDate) return safeData;
    return safeData.filter((row) => {
      if (!row.created_at) return false;
      const created = parseISO(row.created_at);
      return isWithinInterval(created, { start: startDate, end: endDate });
    });
  }, [safeData, dateRange, enableDateFilter]);

  // Use filtered data for table
  const table = useTable(filteredByDate, 10, statusOptions);
  const TableBody = enableDragDrop ? CategoryDragDrop : "tbody";

  // Refresh function
  const handleRefresh = () => {
    if (onRefresh) {
      // If custom refresh function is provided, use it
      onRefresh();
    } else {
      // Default refresh behavior - reset table state
      table.setPage(1);
      table.setSearchTerm("");
      table.setStatusFilter("all");
      table.setSortBy("recent");
      setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
      table.selected = [];
    }
    toast.success("Table data refreshed successfully!");
  };

  const handleBulkDelete = () => {
    if (table.selected.length > 0 && onDelete) {
      table.selected.forEach((id) => {
        const row = data.find((item) => item.id === id);
        if (row) onDelete(row);
      });
    }
  };

  // Helper to render a table row's cells
  const renderRowCells = (row, index) => {
    if (!row) return null;
    
    return (
    <>
      {selectable && (
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={table.selected.includes(row.id)}
            onChange={() => table.toggleSelect(row.id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </td>
      )}
      {columns.map((col) => {
        let value = row[col.accessor];

        // Use custom render function if provided
        if (typeof col.render === "function") {
          return (
            <td
              key={col.accessor}
              className={`px-4 py-4 text-sm capitalize ${
                mode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {col.render(row, value, index)}
            </td>
          );
        }

        if (col.type === "image") {
          return (
            <td key={col.accessor} className="px-4 py-4">
              <Image
                src={value}
                alt={row.name || "Image"}
                className={`w-10 h-10 rounded-full object-cover border-2 ${
                  mode === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
                width={40}
                height={40}
              />
            </td>
          );
        }

        return (
          <td
            key={col.accessor}
            className={`px-4 py-4 text-sm ${
              mode === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </td>
        );
      })}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Custom actions */}
          {actions.map((action, i) => {
            if (!action) return null;
            // Only show if action.show is not defined or returns true
            if (typeof action.show === 'function' && !action.show(row)) return null;
            if (typeof action.render === 'function') {
              return <React.Fragment key={action.label || i}>{action.render(row)}</React.Fragment>;
            }
            if (typeof action.onClick !== 'function') return null;
            
            const label = typeof action.label === 'function' ? action.label(row) : action.label;
            const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
            const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : action.disabled;
            const tooltip = typeof action.tooltip === 'function' ? action.tooltip(row) : action.tooltip;
            
            return (
              <TooltipIconButton
                key={label || i}
                icon={icon || 'mdi:help'}
                label={tooltip || label || ''}
                onClick={isDisabled ? undefined : () => action.onClick(row)}
                mode={mode}
                className={`${action.className || ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isDisabled}
              />
            );
          })}
          {/* Edit/Delete */}
          {onEdit && (
            <TooltipIconButton
              icon="cuida:edit-outline"
              label="Edit"
              onClick={() => onEdit(row)}
              mode={mode}
              className="bg-blue-50 text-blue-600 text-xs"
            />
          )}
          {onDelete && (
            <TooltipIconButton
              icon="mynaui:trash"
              label="Delete"
              onClick={() => onDelete(row)}
              mode={mode}
              className="bg-red-50 text-red-600 text-xs"
            />
          )}
        </div>
      </td>
    </>
    );
  };

  // Open popover and set position
  const handleDateButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setShowDatePicker((v) => !v);
  };

  return (
    <div className={`rounded-xl shadow-lg border overflow-hidden ${
      mode === "dark" 
        ? "bg-gray-900 border-gray-700" 
        : "bg-white border-gray-200"
    }`}>
      {/* Header */}
      {(title || searchable || onAddNew || enableDateFilter) && (
        <div className={`p-6 border-b ${
          mode === "dark" 
            ? "border-gray-700 bg-gray-800" 
            : "border-gray-200 bg-gray-50"
        }`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {title && (
              <h2 className={`text-xl font-semibold mb-2 sm:mb-0 ${
                mode === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {title}
              </h2>
            )}
            <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 w-full">
              {/* Unified Filter/Search Row */}
              <div className="flex flex-1 flex-wrap gap-3 items-center">
                {/* Search */}
                {searchable && (
                  <div className="relative flex items-center gap-2">
                    
                    <Icon
                      icon="mdi:magnify"
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        mode === "dark" ? "text-gray-400" : "text-gray-400"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={table.searchTerm}
                      onChange={(e) => table.setSearchTerm(e.target.value)}
                      className={`pl-10 pr-4 py-2 w-56 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        mode === "dark" 
                          ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400" 
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                      }`}
                    />
                    {onAddNew && (
                      <button
                        onClick={onAddNew}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ml-2"
                      >
                        <Icon icon="mdi:plus" className="w-4 h-4" />
                        {addNewLabel}
                      </button>
                    )}
                  </div>
                )}
                {/* Status Filter for sales returns */}
                {statusOptions && (
                  <div>
                    <select
                      value={table.statusFilter}
                      onChange={e => table.setStatusFilter(e.target.value)}
                      className={`border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        mode === "dark" 
                          ? "border-gray-600 bg-gray-800 text-gray-100" 
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                    >
                      <option value="all">All</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Sort By Filter */}
                <div>
                  {/* <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Sort By</label> */}
                  <select
                    value={table.sortBy}
                    onChange={e => table.setSortBy(e.target.value)}
                    className={`border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      mode === "dark" 
                        ? "border-gray-600 bg-gray-800 text-gray-100" 
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="recent">Recently Added</option>
                    <option value="asc">Ascending (A-Z)</option>
                    <option value="desc">Descending (Z-A)</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_7_days">Last 7 Days</option>
                  </select>
                </div>
                {/* Date Filter Button */}
                {enableDateFilter && (
                  <div className="relative">
                    <button
                      type="button"
                      ref={buttonRef}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                        mode === "dark" 
                          ? "border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700" 
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={handleDateButtonClick}
                    >
                      <Icon icon="mdi:calendar-range" className="w-4 h-4" />
                      Filter by Date
                    </button>
                    {showDatePicker && ReactDOM.createPortal(
                      <div
                        ref={datePickerRef}
                        className={`z-[9999] fixed border rounded-lg shadow-lg p-4 ${
                          mode === "dark" 
                            ? "bg-gray-900 border-gray-700" 
                            : "bg-white border-gray-200"
                        }`}
                        style={{ top: popoverPosition.top, left: popoverPosition.left }}
                      >
                        <DateRange
                          ranges={dateRange}
                          onChange={(ranges) => setDateRange([ranges.selection])}
                          moveRangeOnFirstSelection={false}
                          showDateDisplay={true}
                          editableDateInputs={true}
                          maxDate={new Date()}
                        />
                        <div className="flex justify-end mt-2 gap-2">
                          <button
                            className={`px-3 py-1 rounded ${
                              mode === "dark" 
                                ? "bg-gray-700 text-gray-100" 
                                : "bg-gray-200 text-gray-700"
                            }`}
                            onClick={() => {
                              setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
                              setShowDatePicker(false);
                            }}
                          >
                            Clear
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => setShowDatePicker(false)}
                          >
                            Apply
                          </button>
                        </div>
                        {(dateRange[0].startDate && dateRange[0].endDate) && (
                          <div className={`mt-2 text-xs ${
                            mode === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}>
                            Showing from {format(dateRange[0].startDate, 'yyyy-MM-dd')} to {format(dateRange[0].endDate, 'yyyy-MM-dd')}
                          </div>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                )}
                {/* Refresh Button - Always visible */}
                <TooltipIconButton
                  icon="mdi:refresh"
                  label="Refresh Data"
                  onClick={handleRefresh}
                  mode={mode}
                  className="bg-blue-50 text-blue-600 text-xs"
                />
              </div>
              
              {/* Export button positioned on the right */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Export Data"
                >
                  <Icon icon="mdi:export" className="w-4 h-4" />
                  Export Data
                </button>
              </div>
              
              {/* Export button for non-searchable tables */}
              {/* {!searchable && (
                <div className="flex items-center gap-2">
                  {onAddNew && (
                    <button
                      onClick={onAddNew}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Icon icon="mdi:plus" className="w-4 h-4" />
                      {addNewLabel}
                    </button>
                  )}
                </div>
              )} */}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && table.selected.length > 0 && (
        <div className={`px-6 py-3 border-b ${
          mode === "dark" 
            ? "bg-blue-900/20 border-blue-800" 
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              mode === "dark" ? "text-blue-300" : "text-blue-700"
            }`}>
              {table.selected.length} item
              {table.selected.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === "dark" 
                  ? "bg-red-900/30 text-red-300 hover:bg-red-900/50" 
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              <Icon icon="mdi:delete" className="w-3 h-3" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${
            mode === "dark" ? "bg-gray-800" : "bg-gray-50"
          }`}>
            <tr>
              {enableDragDrop && <th className="w-8 px-3 py-4"></th>}
              {selectable && (
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={
                      table.paged.length > 0 &&
                      table.paged.every((row) =>
                        table.selected.includes(row.id)
                      )
                    }
                    onChange={table.selectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  className={`px-4 py-4 text-left text-sm font-semibold ${
                    mode === "dark" ? "text-gray-300" : "text-gray-600"
                  } ${
                    col.sortable !== false
                      ? `cursor-pointer select-none ${
                          mode === "dark"
                            ? "hover:bg-gray-800"
                            : "hover:bg-gray-100"
                        }`
                      : ""
                  }`}
                  onClick={
                    col.sortable !== false
                      ? () => table.handleSort(col.accessor)
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    {col.Header
                      ? col.Header.split(" ")
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(" ")
                      : ""}
                    {col.sortable !== false && (
                      <div className="flex flex-col">
                        <Icon
                          icon="mdi:chevron-up"
                          className={`w-3 h-3 ${
                            table.sortKey === col.accessor &&
                            table.sortDir === "asc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          }`}
                        />
                        <Icon
                          icon="mdi:chevron-down"
                          className={`w-3 h-3 -mt-1 ${
                            table.sortKey === col.accessor &&
                            table.sortDir === "desc"
                              ? "text-blue-600"
                              : "text-gray-300"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {/* Only render actions column if needed */}
              {(actions.length > 0 || onEdit || onDelete) && (
                <th className={`px-4 py-4 text-left text-xs font-semibold ${
                  mode === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <TableBody
            items={enableDragDrop ? table.paged : undefined}
            onReorder={
              enableDragDrop
                ? (paged, fromIdx, toIdx) =>
                    onReorder(paged, fromIdx, toIdx, table.page, table.pageSize)
                : undefined
            }
            className={`${
              mode === "dark" 
                ? "bg-gray-900 divide-gray-700" 
                : "bg-white divide-gray-200"
            }`}
          >
            {enableDragDrop
              ? (item, idx) => renderRowCells(item, idx)
              : table.paged.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={
                        columns.length +
                        (selectable ? 1 : 0) +
                        (enableDragDrop ? 1 : 0) +
                        ((actions.length > 0 || onEdit || onDelete) ? 1 : 0)
                      }
                      className="px-4 py-12 text-center"
                    >
                      <div className={`${
                        mode === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>
                        <div className="flex justify-center text-4xl mb-3 ">
                          <Icon icon="mdi:table-search" className="w-10 h-10" />
                        </div>
                        <div className="text-sm font-medium">{emptyMessage}</div>
                      </div>
                    </td>
                  </tr>
                )
                : table.paged.map((row, index) => {
                    const defaultRow = (
                      <tr
                        key={row.id || index}
                        className={`transition-colors ${
                          mode === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-50"
                        }`}
                      >
                        {enableDragDrop && <td className="px-3 py-4"></td>}
                        {renderRowCells(row, index)}
                      </tr>
                    );
                    // If customRowRender is provided, use it to render extra content (e.g. expanded row)
                    return customRowRender
                      ? customRowRender(row, index, defaultRow)
                      : defaultRow;
                  })
            }
          </TableBody>
        </table>
      </div>

      {/* Footer with pagination */}
      <div className={`px-6 py-4 border-t ${
        mode === "dark" 
          ? "bg-gray-800 border-gray-700" 
          : "bg-gray-50 border-gray-200"
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={`flex items-center gap-4 text-sm ${
            mode === "dark" ? "text-gray-300" : "text-gray-700"
          }`}>
            <div>
              Showing{" "}
              <span className="font-medium">
                {(table.page - 1) * table.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(table.page * table.pageSize, table.totalItems)}
              </span>{" "}
              of <span className="font-medium">{table.totalItems}</span> results
            </div>
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <select
                value={table.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className={`border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  mode === "dark" 
                    ? "border-gray-600 bg-gray-800 text-gray-100" 
                    : "border-gray-300 bg-white text-gray-900"
                }`}
              >
                {[5, 10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.handlePage(table.page - 1)}
              disabled={table.page === 1}
              className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                mode === "dark" 
                  ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700" 
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:chevron-left" className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, table.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => table.handlePage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      table.page === pageNum
                        ? "bg-blue-900 text-white shadow-sm"
                        : `${
                            mode === "dark" 
                              ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700" 
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          } border`
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => table.handlePage(table.page + 1)}
              disabled={table.page === table.totalPages}
              className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                mode === "dark" 
                  ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700" 
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
              <Icon icon="mdi:chevron-right" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        users={filteredByDate}
        mode={mode}
        type={exportType}
        stores={stores}
        title={exportTitle || `Export ${title || 'Data'}`}
        getFieldsOrder={getFieldsOrder}
        getDefaultFields={getDefaultFields}
      />
    </div>
  );
}
