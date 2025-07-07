import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Papa from "papaparse";
import SimpleModal from "./SimpleModal";

const PURCHASE_COLUMNS = [
  "purchase_number",
  "supplier_id",
  "warehouse_id",
  "date",
  "status",
  "total",
  "notes",
  "product_id",
  "quantity",
  "unit_cost",
];
const PURCHASE_SAMPLE = [
  [
    "PUR-001",
    "uuid-supplier-1",
    "uuid-warehouse-1",
    "2024-06-01",
    "Received",
    "1200.5",
    "First purchase",
    "uuid-product-1",
    "2",
    "100",
  ],
  [
    "PUR-001",
    "uuid-supplier-1",
    "uuid-warehouse-1",
    "2024-06-01",
    "Received",
    "1200.5",
    "First purchase",
    "uuid-product-2",
    "4",
    "250",
  ],
  [
    "PUR-002",
    "uuid-supplier-2",
    "uuid-warehouse-2",
    "2024-06-03",
    "Pending",
    "800",
    "Second purchase",
    "uuid-product-3",
    "1",
    "800",
  ],
];

const SUPPLIER_COLUMNS = [
  "name", "email", "phone", "address", "company", "is_active"
];
const SUPPLIER_SAMPLE = [
  ["John Doe", "john@example.com", "1234567890", "123 Main St", "Acme Inc", "true"],
  ["Jane Smith", "jane@example.com", "0987654321", "456 Oak Ave", "Widgets LLC", "false"],
  ["Mike Johnson", "mike@example.com", "5551234567", "789 Pine Rd", "Tech Corp", "true"],
];

export default function CategoryCSVImport({ onImport, label = "Import", mode = "light", type = "purchases" }) {
  const fileInputRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [errorRows, setErrorRows] = useState([]);
  const [errorModal, setErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState([]);

  const validateRow = (row) => {
    // Purchases validation
    if (type === "purchases") {
      const requiredPurchase = ["purchase_number", "supplier_id", "warehouse_id", "date", "status", "total", "notes"];
      const requiredItem = ["product_id", "quantity", "unit_cost"];
      let errors = [];
      for (const col of requiredPurchase) {
        if (!row[col]) errors.push(`Missing ${col}`);
      }
      for (const col of requiredItem) {
        if (!row[col]) errors.push(`Missing ${col}`);
      }
      if (row.quantity && isNaN(Number(row.quantity))) errors.push("Quantity must be a number");
      if (row.unit_cost && isNaN(Number(row.unit_cost))) errors.push("Unit cost must be a number");
      return errors;
    }
    // Suppliers validation
    if (type === "suppliers") {
      const required = ["name", "email", "phone", "address", "company", "is_active"];
      let errors = [];
      for (const col of required) {
        if (!row[col]) errors.push(`Missing ${col}`);
      }
      if (row.is_active && !["true", "false", true, false].includes(row.is_active)) errors.push("is_active must be true or false");
      return errors;
    }
    return [];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          alert("CSV Parse Error: " + results.errors[0].message);
        } else if (onImport) {
          // Validate rows
          const errors = [];
          const validRows = [];
          results.data.forEach((row, idx) => {
            const rowErrors = validateRow(row);
            if (rowErrors.length > 0) {
              errors.push({ row: idx + 2, errors: rowErrors, data: row }); // +2 for header and 1-based
            } else {
              validRows.push(row);
            }
          });
          if (errors.length > 0) {
            setErrorRows(errors);
            setErrorDetails(errors);
            setErrorModal(true);
          }
          if (validRows.length > 0) {
            onImport(validRows);
          }
        }
      },
      error: (err) => {
        alert("CSV Parse Error: " + err.message);
      },
    });
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleProceed = () => {
    setShowModal(false);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Download failed rows as CSV
  const handleDownloadErrors = () => {
    const csv = [
      Object.keys(errorRows[0]?.data || {}).join(","),
      ...errorRows.map(e => Object.values(e.data).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `failed_rows.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show different instructions for purchases
  const isPurchases = type === "purchases";

  // Purchases modal layout
  const renderPurchasesModal = () => (
    <SimpleModal
      isOpen={showModal}
      onClose={handleCloseModal}
      title="Import Purchases from CSV"
      mode={mode}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
              CSV File Format Requirements
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Please ensure your CSV file follows these specifications for successful import
            </p>
          </div>
        </div>
        {/* Requirements Section */}
        <div className="space-y-4">
          <div className="grid gap-4">
            {/* File Format */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <Icon icon="mdi:file-document" className="w-4 h-4 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  File must be in <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">CSV</span> format with a header row
                </p>
              </div>
            </div>
            {/* Required Columns */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <Icon icon="mdi:table-column" className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Required columns (case-sensitive):
                </p>
                <div className="flex flex-wrap gap-2">
                  {PURCHASE_COLUMNS.map((col) => (
                    <span key={col} className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Data Types */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                <Icon icon="mdi:format-list-checks" className="w-4 h-4 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded text-xs font-mono">quantity</span> and <span className="px-2 py-1 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded text-xs font-mono">unit_cost</span> must be valid numbers. Each row represents a line item. Purchases with multiple items should repeat the purchase columns for each item.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Example Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:table" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Example CSV Format:
            </h4>
          </div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    {PURCHASE_COLUMNS.map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PURCHASE_SAMPLE.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              onClick={() => navigator.clipboard.writeText(
                [PURCHASE_COLUMNS.join(","), ...PURCHASE_SAMPLE.map(row => row.join(","))].join("\n")
              )}
              title="Copy CSV format to clipboard"
            >
              <Icon icon="mdi:content-copy" className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="px-6 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={handleCloseModal}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
            onClick={handleProceed}
          >
            <Icon icon="mdi:upload" className="w-4 h-4" />
            Proceed to Upload
          </button>
        </div>
      </div>
    </SimpleModal>
  );

  // Suppliers modal layout
  const renderSuppliersModal = () => (
    <SimpleModal
      isOpen={showModal}
      onClose={handleCloseModal}
      title="Import Suppliers from CSV"
      mode={mode}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
              CSV File Format Requirements
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Please ensure your CSV file follows these specifications for successful import
            </p>
          </div>
        </div>
        {/* Requirements Section */}
        <div className="space-y-4">
          <div className="grid gap-4">
            {/* File Format */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <Icon icon="mdi:file-document" className="w-4 h-4 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  File must be in <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">CSV</span> format with a header row
                </p>
              </div>
            </div>
            {/* Required Columns */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <Icon icon="mdi:table-column" className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Required columns (case-sensitive):
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUPPLIER_COLUMNS.map((col) => (
                    <span key={col} className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Data Types */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                <Icon icon="mdi:format-list-checks" className="w-4 h-4 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  The <span className="px-2 py-1 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded text-xs font-mono">is_active</span> column should contain either <span className="px-1 py-0.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs font-mono">true</span> or <span className="px-1 py-0.5 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs font-mono">false</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Example Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:table" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Example CSV Format:
            </h4>
          </div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    {SUPPLIER_COLUMNS.map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUPPLIER_SAMPLE.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              onClick={() => navigator.clipboard.writeText(
                [SUPPLIER_COLUMNS.join(","), ...SUPPLIER_SAMPLE.map(row => row.join(","))].join("\n")
              )}
              title="Copy CSV format to clipboard"
            >
              <Icon icon="mdi:content-copy" className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="px-6 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={handleCloseModal}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
            onClick={handleProceed}
          >
            <Icon icon="mdi:upload" className="w-4 h-4" />
            Proceed to Upload
          </button>
        </div>
      </div>
    </SimpleModal>
  );

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        onClick={handleOpenModal}
      >
        <Icon icon="mdi:upload" className="w-4 h-4" />
        {label}
      </button>
      <input
        type="file"
        accept=".csv,text/csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {type === "purchases" ? renderPurchasesModal() : null}
      {type === "suppliers" ? renderSuppliersModal() : null}
      {/* Error Modal */}
      {errorModal && (
        <SimpleModal
          isOpen={true}
          onClose={() => setErrorModal(false)}
          title="Import Errors"
          mode={mode}
          width="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-200">
              <Icon icon="mdi:alert-circle-outline" className="w-6 h-6" />
              <span className="font-semibold">Some rows could not be imported:</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full text-xs border">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-2 py-1">Row</th>
                    <th className="px-2 py-1">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {errorDetails.map((err, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1">{err.row}</td>
                      <td className="px-2 py-1 text-red-600 dark:text-red-300">
                        {err.errors.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                onClick={() => setErrorModal(false)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-800"
                onClick={handleDownloadErrors}
              >
                Download Failed Rows
              </button>
            </div>
          </div>
        </SimpleModal>
      )}
    </>
  );
} 