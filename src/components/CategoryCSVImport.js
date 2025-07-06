import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Papa from "papaparse";
import SimpleModal from "./SimpleModal";

export default function CategoryCSVImport({ onImport, label = "Import", mode = "light", type = "purchases" }) {
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

  // Show different instructions for purchases
  const isPurchases = type === "purchases";

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
        title={isPurchases ? "Import Purchases from CSV" : "Import from CSV"}
        mode={mode}
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200">
            <Icon icon="mdi:information-outline" className="w-6 h-6" />
            <span className="font-semibold">How to format your CSV file:</span>
          </div>
          {isPurchases ? (
            <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-200">
              <li>File must be in <b>CSV</b> format with a header row.</li>
              <li>Required columns for purchases: <b>purchase_number</b>, <b>supplier_id</b>, <b>warehouse_id</b>, <b>date</b>, <b>status</b>, <b>total</b>, <b>notes</b></li>
              <li>Required columns for line items: <b>product_id</b>, <b>quantity</b>, <b>unit_cost</b></li>
              <li>Each row represents a line item. Purchases with multiple items should repeat the purchase columns for each item.</li>
              <li>Example:
                <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 mt-2 text-xs overflow-x-auto">
purchase_number,supplier_id,warehouse_id,date,status,total,notes,product_id,quantity,unit_cost
PUR-001,uuid-supplier-1,uuid-warehouse-1,2024-06-01,Received,1200.5,First purchase,uuid-product-1,2,100
PUR-001,uuid-supplier-1,uuid-warehouse-1,2024-06-01,Received,1200.5,First purchase,uuid-product-2,4,250
PUR-002,uuid-supplier-2,uuid-warehouse-2,2024-06-03,Pending,800,Second purchase,uuid-product-3,1,800
                </pre>
              </li>
            </ul>
          ) : (
            <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-200">
              <li>File must be in <b>CSV</b> format with a header row.</li>
              <li>Required columns: <b>name</b>, <b>email</b>, <b>phone</b>, <b>address</b>, <b>company</b>, <b>is_active</b></li>
              <li><b>is_active</b> should be <b>true</b> or <b>false</b>.</li>
              <li>Example:
                <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 mt-2 text-xs overflow-x-auto">
name,email,phone,address,company,is_active
John Doe,john@example.com,1234567890,123 Main St,Acme Inc,true
Jane Smith,jane@example.com,0987654321,456 Oak Ave,Widgets LLC,false
                </pre>
              </li>
            </ul>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800"
              onClick={handleProceed}
            >
              Proceed to Upload
            </button>
          </div>
        </div>
      </SimpleModal>
    </>
  );
} 