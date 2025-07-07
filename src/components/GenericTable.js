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

// Enhanced useTable hook
function useTable(data, initialPageSize = 10) {
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
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(row => {
        if (statusFilter === "active") return row.is_active === true;
        if (statusFilter === "inactive") return row.is_active === false;
        return true;
      });
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
  }, [data, searchTerm, statusFilter, sortBy]);

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

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paged = sortedData.slice((page - 1) * pageSize, page * pageSize);

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
    totalItems: sortedData.length,
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
  enableDateFilter = false,
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
  const table = useTable(filteredByDate);
  const TableBody = enableDragDrop ? CategoryDragDrop : "tbody";

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
              className="px-4 py-4 text-sm text-gray-900 dark:text-white"
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
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                width={40}
                height={40}
              />
            </td>
          );
        }

        return (
          <td
            key={col.accessor}
            className="px-4 py-4 text-sm text-gray-900 dark:text-white"
          >
            {value}
          </td>
        );
      })}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Custom actions */}
          {actions.map((action, i) => {
            if (!action || typeof action.onClick !== 'function') return null;
            
            const label = typeof action.label === 'function' ? action.label(row) : action.label;
            const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
            
            return (
              <button
                key={label || i}
                onClick={() => action.onClick(row)}
                className={`p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors ${action.className || ''}`}
                title={label || ''}
              >
                <Icon icon={icon || 'mdi:help'} className="w-4 h-4" />
              </button>
            );
          })}
          {/* Edit/Delete */}
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
              title="Edit"
            >
              <Icon icon="cuida:edit-outline" className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
              title="Delete"
            >
              <Icon icon="mynaui:trash" className="w-4 h-4" />
            </button>
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
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      {(title || searchable || onAddNew || enableDateFilter) && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                {title}
              </h2>
            )}
            <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 w-full">
              {/* Unified Filter/Search Row */}
              <div className="flex flex-1 flex-wrap gap-3 items-center">
                {/* Search */}
                {searchable && (
                  <div className="relative">
                    <Icon
                      icon="mdi:magnify"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={table.searchTerm}
                      onChange={(e) => table.setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-56 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                )}
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={table.statusFilter}
                    onChange={e => table.setStatusFilter(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {/* Sort By Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Sort By</label>
                  <select
                    value={table.sortBy}
                    onChange={e => table.setSortBy(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={handleDateButtonClick}
                    >
                      <Icon icon="mdi:calendar-range" className="w-4 h-4" />
                      Filter by Date
                    </button>
                    {showDatePicker && ReactDOM.createPortal(
                      <div
                        ref={datePickerRef}
                        className="z-[9999] fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
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
                            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
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
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                            Showing from {format(dateRange[0].startDate, 'yyyy-MM-dd')} to {format(dateRange[0].endDate, 'yyyy-MM-dd')}
                          </div>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                )}
              </div>
              {/* Export, Import, and Add New on the right */}
              <div className="flex items-center gap-3 ml-auto">
                <CategoryCSVExport data={safeData} filename={`${title?.replace(/\s+/g, "_") || "data"}.csv`} />
                {onImport && (
                  <CategoryCSVImport onImport={onImport} type={importType} />
                )}
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
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && table.selected.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {table.selected.length} item
              {table.selected.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
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
          <thead className="bg-gray-50 dark:bg-gray-800">
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
                  className={`px-4 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 ${
                    col.sortable
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                      : ""
                  }`}
                  onClick={
                    col.sortable
                      ? () => table.handleSort(col.accessor)
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    {col.header
                      .split(" ")
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(" ")}
                    {col.sortable && (
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
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                Actions
              </th>
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
            className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
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
                        1
                      }
                      className="px-4 py-12 text-center"
                    >
                      <div className="text-gray-500 dark:text-gray-400">
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
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
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
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
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
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <Icon icon="mdi:chevron-right" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
