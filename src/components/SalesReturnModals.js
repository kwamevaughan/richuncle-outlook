  import React, { useState, useEffect, useMemo, useRef } from "react";
  import SimpleModal from "./SimpleModal";
  import { Icon } from "@iconify/react";
  import Select, { components } from 'react-select';
  import SaleDetailsModal from "./SaleDetailsModal";

  export default function SalesReturnModals({
    show,
    onClose,
    onSave,
    onDelete,
    salesReturn,
    mode = "light",
    loading = false,
    error = null,
    children,
    selectedReference,
    onReferenceChange,
    user, // <-- add user prop
    orders = [], // <-- add orders prop for lookup
  }) {
    const [form, setForm] = useState({
      customer_id: "",
      store_id: "",
      date: "",
      status: "Pending",
      return_number: "",
      reference: "",
      total: 0,
      notes: "",
    });
    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);
    const [orderSearch, setOrderSearch] = useState("");
    const [modalError, setModalError] = useState(null);
    const [orderCustomerId, setOrderCustomerId] = useState("");
    const [walkInName, setWalkInName] = useState("");
    const [walkInPhone, setWalkInPhone] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [_, forceUpdate] = useState(0);
    const prevShow = useRef(false);
    const [referenceOrderItems, setReferenceOrderItems] = useState([]);
    const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);

    // Custom styles for react-select based on mode
    const selectStyles = {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: mode === "dark" ? "#374151" : "#ffffff",
        borderColor: mode === "dark" ? "#4B5563" : "#D1D5DB",
        color: mode === "dark" ? "#F9FAFB" : "#111827",
        "&:hover": {
          borderColor: mode === "dark" ? "#6B7280" : "#9CA3AF",
        },
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: mode === "dark" ? "#374151" : "#ffffff",
        border: `1px solid ${mode === "dark" ? "#4B5563" : "#D1D5DB"}`,
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused 
          ? (mode === "dark" ? "#4B5563" : "#F3F4F6")
          : "transparent",
        color: mode === "dark" ? "#F9FAFB" : "#111827",
        "&:hover": {
          backgroundColor: mode === "dark" ? "#4B5563" : "#F3F4F6",
        },
      }),
      singleValue: (provided) => ({
        ...provided,
        color: mode === "dark" ? "#F9FAFB" : "#111827",
      }),
      input: (provided) => ({
        ...provided,
        color: mode === "dark" ? "#F9FAFB" : "#111827",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: mode === "dark" ? "#9CA3AF" : "#6B7280",
      }),
    };

    // Fetch customers, stores, and recent sales/orders
    useEffect(() => {
      fetch("/api/customers")
        .then(async (res) => {
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("/api/customers returned non-JSON:", text);
            setModalError("Failed to fetch customers");
            return { data: [] };
          }
          return res.json();
        })
        .then(({ data }) => setCustomers(data || []));
      fetch("/api/stores")
        .then(async (res) => {
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error("/api/stores returned non-JSON:", text);
            setModalError("Failed to fetch stores");
            return { data: [] };
          }
          return res.json();
        })
        .then(({ data }) => setStores(data || []));
    }, []);

    useEffect(() => {
      if (selectedReference) {
        fetch(`/api/orders?id=${selectedReference}`)
          .then(async (res) => {
            const contentType = res.headers.get("content-type");
            if (!res.ok || !contentType || !contentType.includes("application/json")) {
              const text = await res.text();
              console.error(`/api/orders?id=${selectedReference} returned non-JSON:`, text);
              setModalError("Failed to fetch order by reference");
              return { data: null };
            }
            return res.json();
          })
          .then(({ data }) => {
            if (data) {
              setCustomerId(data.customer_id || "");
              setOrderCustomerId(data.customer_id || "");
              setForm(prev => ({
                ...prev,
                store_id: data.store_id || ""
              }));
              if (!data.customer_id) {
                setWalkInName(data.customer_name || "");
                setWalkInPhone(data.customer_phone || "");
              }
            }
          });
        // Fetch order items for the selected reference
        fetch(`/api/order-items?order_id=${selectedReference}`)
          .then(async (res) => {
            const contentType = res.headers.get("content-type");
            if (!res.ok || !contentType || !contentType.includes("application/json")) {
              const text = await res.text();
              console.error(`/api/order-items?order_id=${selectedReference} returned non-JSON:`, text);
              setModalError("Failed to fetch order items");
              return { data: [] };
            }
            return res.json();
          })
          .then(({ data }) => {
            setReferenceOrderItems(Array.isArray(data) ? data : []);
          });
      } else {
        setReferenceOrderItems([]);
      }
    }, [selectedReference]);

    // Populate form when editing
    useEffect(() => {
      if (show && !prevShow.current) {
        if (salesReturn) {
          // Use onReferenceChange to set the reference
          if (onReferenceChange) {
            onReferenceChange(
              salesReturn.reference ? String(salesReturn.reference) : ""
            );
          }
          setCustomerId(salesReturn.customer_id || "");
          setForm({
            store_id: salesReturn.store_id || "",
            date: salesReturn.date || "",
            status: salesReturn.status || "Pending",
            return_number: salesReturn.return_number || "",
            total: salesReturn.total || 0,
            notes: salesReturn.notes || "",
          });
        } else {
          if (onReferenceChange) {
            onReferenceChange("");
          }
          setCustomerId("");
          setForm({
            store_id: "",
            date: "",
            status: "Pending",
            return_number: "",
            total: 0,
            notes: "",
          });
        }
        setModalError(null);
      }
      prevShow.current = show;
    }, [salesReturn, show, onReferenceChange]);

    // When reference changes, fetch the order and set customer
    useEffect(() => {
      if (selectedReference) {
        fetch(`/api/orders?id=${selectedReference}`)
          .then(async (res) => {
            const contentType = res.headers.get("content-type");
            if (!res.ok || !contentType || !contentType.includes("application/json")) {
              const text = await res.text();
              console.error(`/api/orders?id=${selectedReference} returned non-JSON:`, text);
              setModalError("Failed to fetch order by ID");
              return { data: null };
            }
            return res.json();
          })
          .then(({ data }) => {
            if (data) {
              setCustomerId(data.customer_id || "");
              setOrderCustomerId(data.customer_id || "");
              if (!data.customer_id) {
                setWalkInName(data.customer_name || "");
                setWalkInPhone(data.customer_phone || "");
              }
            }
          });
      }
    }, [selectedReference]);

    // When customerId changes, clear walk-in fields if not walk-in
    useEffect(() => {
      if (customerId) {
        setWalkInName("");
        setWalkInPhone("");
      }
    }, [customerId]);

    // Handle form field changes
    const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    };

    

    // Calculate total from line items
    const lineItems = children && children.props && children.props.lineItems ? children.props.lineItems : [];
    const calculatedTotal = lineItems.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      0
    );

    // Filter orders for reference/original sale search
    const filteredOrders = useMemo(() => {
      return orderSearch
        ? orders.filter((o) =>
            (o.order_number || o.id || "")
              .toLowerCase()
              .includes(orderSearch.toLowerCase())
          )
        : orders;
    }, [orders, orderSearch]);

    // Handle form submit
    const handleSubmit = (e) => {
      e.preventDefault();
      // Validation
      const requiredFields = ["store_id", "date", "status"];
      if (customerId) {
        requiredFields.push("customer_id");
      }
      for (const field of requiredFields) {
        if (!form[field]) {
          setModalError(`Missing required field: ${field.replace(/_/g, " ")}`);
          return;
        }
      }
      if (!lineItems || lineItems.length === 0) {
        setModalError("At least one line item is required.");
        return;
      }
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        if (!item.product_id) {
          setModalError(`Line item ${i + 1}: Product is required.`);
          return;
        }
        if (
          !item.quantity ||
          isNaN(Number(item.quantity)) ||
          Number(item.quantity) <= 0
        ) {
          setModalError(`Line item ${i + 1}: Quantity must be greater than 0.`);
          return;
        }
        if (
          item.unit_price === undefined ||
          isNaN(Number(item.unit_price)) ||
          Number(item.unit_price) < 0
        ) {
          setModalError(`Line item ${i + 1}: Unit price must be 0 or greater.`);
          return;
        }
      }
      // Prepare data for save
      const returnData = {
        ...form,
        reference: selectedReference,
        customer_id: customerId,
        total: calculatedTotal,
      };
      console.log('SalesReturnModals: lineItems before save', lineItems);
      // No need to set walk_in_name or walk_in_phone for returns
      if (onSave) onSave(returnData, lineItems.map(({ sales_return_id, ...rest }) => rest));
    };

    const isEdit = !!salesReturn;

    // Find the referenced sale
    const referencedSale = orders.find(o => String(o.id) === String(selectedReference));


    return (
      <SimpleModal
        isOpen={show}
        onClose={onClose}
        title={isEdit ? "Edit Sales Return" : "Add Sales Return"}
        mode={mode}
        width="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reference/Original Sale FIRST */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                mode === "dark" ? "text-gray-200" : "text-gray-700"
              }`}>Reference/Original Sale</label>
              <Select
                options={filteredOrders.map((o) => ({
                  value: String(o.id),
                  label: `${o.order_number || o.id} - ${o.customer_name || ''}`,
                  order: o,
                }))}
                value={filteredOrders
                  .filter((o) => String(o.id) === String(selectedReference))
                  .map((o) => ({
                    value: String(o.id),
                    label: `${o.order_number || o.id} - ${o.customer_name || ''}`,
                    order: o,
                  }))[0] || null}
                onChange={option => {
                  if (option && option.order) {
                    onReferenceChange(option.value);
                    setForm(prev => ({
                      ...prev,
                      store_id: option.order.store_id || ""
                    }));
                  } else {
                    onReferenceChange("");
                    setForm(prev => ({
                      ...prev,
                      store_id: ""
                    }));
                  }
                }}
                isClearable
                isSearchable
                placeholder="Search or select sale/invoice..."
                classNamePrefix="react-select"
                isDisabled={loading}
                styles={selectStyles}
              />
              {selectedReference && (
                user?.role === 'cashier' ? (
                  <>
                    <button
                      type="button"
                      className="text-blue-600 text-xs underline mt-1 inline-block"
                      onClick={() => setShowSaleDetailsModal(true)}
                    >
                      View Original Sale
                    </button>
                    <SaleDetailsModal
                      sale={referencedSale}
                      isOpen={showSaleDetailsModal}
                      onClose={() => setShowSaleDetailsModal(false)}
                      mode={mode}
                    />
                  </>
                ) : (
                  <a
                    href={`/sales?saleId=${selectedReference}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs underline mt-1 inline-block"
                  >
                    View Original Sale
                  </a>
                )
              )}
            </div>
          </div>
          {/* Show reference order line items if a reference is selected */}
          {selectedReference && referenceOrderItems.length > 0 && (
            <div className="my-4">
              <div className={`font-semibold mb-2 ${
                mode === "dark" ? "text-gray-200" : "text-gray-900"
              }`}>Products in Selected Order</div>
              <table className={`min-w-full text-sm border ${
                mode === "dark" ? "border-gray-600" : "border-gray-300"
              }`}>
                <thead className={mode === "dark" ? "bg-gray-700" : "bg-gray-100"}>
                  <tr>
                    <th className={`px-4 py-2 border ${
                      mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"
                    }`}>Product</th>
                    <th className={`px-4 py-2 border ${
                      mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"
                    }`}>Quantity</th>
                    <th className={`px-4 py-2 border ${
                      mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"
                    }`}>Unit Price</th>
                    <th className={`px-4 py-2 border ${
                      mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"
                    }`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {referenceOrderItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className={`px-4 py-2 border ${
                        mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-900"
                      }`}>{item.name}</td>
                      <td className={`px-4 py-2 border text-center ${
                        mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-900"
                      }`}>{item.quantity}</td>
                      <td className={`px-4 py-2 border text-right ${
                        mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-900"
                      }`}>GHS {Number(item.unit_price).toFixed(2)}</td>
                      <td className={`px-4 py-2 border text-right ${
                        mode === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-900"
                      }`}>GHS {Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Line Items Editor comes right after Reference/Original Sale */}
          {children}
          {/* Customer field removed: all returns must reference a sale */}
          {/* Warehouse field remains */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                mode === "dark" ? "text-gray-200" : "text-gray-700"
              }`}>Store Location *</label>
              <input
                type="text"
                value={stores.find(s => s.id === form.store_id)?.name || ''}
                readOnly
                className={`w-full border rounded px-3 py-2 cursor-not-allowed ${
                  mode === "dark" 
                    ? "bg-gray-700 border-gray-600 text-gray-200" 
                    : "bg-gray-100 border-gray-300 text-gray-900"
                }`}
                disabled
                placeholder="Store location"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                mode === "dark" ? "text-gray-200" : "text-gray-700"
              }`}>Date *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  mode === "dark" 
                    ? "bg-gray-700 border-gray-600 text-gray-200" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                required
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                mode === "dark" ? "text-gray-200" : "text-gray-700"
              }`}>Status *</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  mode === "dark" 
                    ? "bg-gray-700 border-gray-600 text-gray-200" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                required
                disabled={loading}
              >
                <option value="Pending">Pending</option>
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                mode === "dark" ? "text-gray-200" : "text-gray-700"
              }`}>
                Return Number
              </label>
              <input
                name="return_number"
                type="text"
                value={form.return_number}
                readOnly
                className={`w-full border rounded px-3 py-2 cursor-not-allowed ${
                  mode === "dark" 
                    ? "bg-gray-700 border-gray-600 text-gray-200" 
                    : "bg-gray-100 border-gray-300 text-gray-900"
                }`}
                disabled
                placeholder="Auto-generated"
              />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              mode === "dark" ? "text-gray-200" : "text-gray-700"
            }`}>Total *</label>
            <input
              name="total"
              type="number"
              min="0"
              step="0.01"
              value={calculatedTotal}
              readOnly
              className={`w-full border rounded px-3 py-2 cursor-not-allowed ${
                mode === "dark" 
                  ? "bg-gray-700 border-gray-600 text-gray-200" 
                  : "bg-gray-100 border-gray-300 text-gray-900"
              }`}
              required
              disabled={true}
              placeholder="Total Amount"
            />
            <div className={`text-xs mt-1 ${
              mode === "dark" ? "text-gray-400" : "text-gray-500"
            }`}>
              Total is auto-calculated from line items.
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              mode === "dark" ? "text-gray-200" : "text-gray-700"
            }`}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${
                mode === "dark" 
                  ? "bg-gray-700 border-gray-600 text-gray-200" 
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              rows={2}
              disabled={loading}
              placeholder="Notes (optional)"
            />
          </div>
          {(modalError || error) && (
            <div className="text-red-600 text-sm">{modalError || error}</div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className={`flex-1 px-4 py-2 border rounded ${
                mode === "dark" 
                  ? "border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600" 
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              }`}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            {isEdit && onDelete && (
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => onDelete(salesReturn.id)}
                disabled={loading}
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </SimpleModal>
    );
  } 