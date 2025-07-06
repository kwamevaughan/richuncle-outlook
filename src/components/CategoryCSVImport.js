import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Papa from "papaparse";
import SimpleModal from "./SimpleModal";

export default function CategoryCSVImport({ onImport, label = "Import", mode = "light" }) {
  const fileInputRef = useRef();
  const [showModal, setShowModal] = useState(false);

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
          onImport(results.data);
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
              <Icon
                icon="mdi:information"
                className="w-5 h-5 text-blue-600 dark:text-blue-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
                CSV File Format Requirements
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Please ensure your CSV file follows these specifications for
                successful import
              </p>
            </div>
          </div>

          {/* Requirements Section */}
          <div className="space-y-4">
            <div className="grid gap-4">
              {/* File Format */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <Icon
                    icon="mdi:file-document"
                    className="w-4 h-4 text-green-600 dark:text-green-300"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    File must be in{" "}
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                      CSV
                    </span>{" "}
                    format with a header row
                  </p>
                </div>
              </div>

              {/* Required Columns */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <Icon
                    icon="mdi:table-column"
                    className="w-4 h-4 text-purple-600 dark:text-purple-300"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Required columns (case-sensitive):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "name",
                      "email",
                      "phone",
                      "address",
                      "company",
                      "is_active",
                    ].map((col) => (
                      <span
                        key={col}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs font-mono"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Types */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                  <Icon
                    icon="mdi:format-list-checks"
                    className="w-4 h-4 text-amber-600 dark:text-amber-300"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    The{" "}
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded text-xs font-mono">
                      is_active
                    </span>{" "}
                    column should contain either{" "}
                    <span className="px-1 py-0.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs font-mono">
                      true
                    </span>{" "}
                    or{" "}
                    <span className="px-1 py-0.5 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs font-mono">
                      false
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Example Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon
                icon="mdi:table"
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
              />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Example CSV Format:
              </h4>
            </div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                        name
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                        email
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                        phone
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                        address
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600">
                        company
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
                        is_active
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        John Doe
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        john@example.com
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        1234567890
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        123 Main St
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        Acme Inc
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs font-mono">
                          true
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        Jane Smith
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        jane@example.com
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        0987654321
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        456 Oak Ave
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        Widgets LLC
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs font-mono">
                          false
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        Mike Johnson
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        mike@example.com
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        5551234567
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        789 Pine Rd
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        Tech Corp
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs font-mono">
                          true
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button
                className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `name,email,phone,address,company,is_active\nJohn Doe,john@example.com,1234567890,123 Main St,Acme Inc,true\nJane Smith,jane@example.com,0987654321,456 Oak Ave,Widgets LLC,false\nMike Johnson,mike@example.com,5551234567,789 Pine Rd,Tech Corp,true`
                  )
                }
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
    </>
  );
} 