  import React, { useState, useEffect, useMemo, useRef } from "react";
  import SimpleModal from "./SimpleModal";
  import { Icon } from "@iconify/react";

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
  }) {
    const [form, setForm] = useState({
      customer_id: "",
      warehouse_id: "",
      date: "",
      status: "Pending",
      return_number: "",
      reference: "",
      total: 0,
      notes: "",
    });
    const [customers, setCustomers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [orderSearch, setOrderSearch] = useState("");
    const [modalError, setModalError] = useState(null);
    const [orderCustomerId, setOrderCustomerId] = useState("");
    const [walkInName, setWalkInName] = useState("");
    const [walkInPhone, setWalkInPhone] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [_, forceUpdate] = useState(0);
    const prevShow = useRef(false);

    // Fetch customers, warehouses, and recent sales/orders
    useEffect(() => {
      fetch("/api/customers")
        .then((res) => res.json())
        .then(({ data }) => setCustomers(data || []));
      fetch("/api/warehouses")
        .then((res) => res.json())
        .then(({ data }) => setWarehouses(data || []));
      fetch("/api/orders")
        .then((res) => res.json())
        .then(({ data }) => setOrders(data || []));
    }, []);

    useEffect(() => {
      if (selectedReference) {
        fetch(`/api/orders/${selectedReference}`)
          .then((res) => res.json())
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
            warehouse_id: salesReturn.warehouse_id || "",
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
            warehouse_id: "",
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
        fetch(`/api/orders/${selectedReference}`)
          .then((res) => res.json())
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

    useEffect(() => {
      console.log("useEffect: form.reference changed:", selectedReference);
    }, [selectedReference]);

    // Calculate total from line items
    const lineItems = children?.props?.items || [];
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
      const requiredFields = ["warehouse_id", "date", "status"];
      if (!customerId) {
        if (!walkInName) {
          setModalError("Walk In Customer Name is required");
          return;
        }
        if (!walkInPhone) {
          setModalError("Walk In Customer Phone is required");
          return;
        }
      } else {
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
      if (!customerId) {
        returnData.walk_in_name = walkInName;
        returnData.walk_in_phone = walkInPhone;
      }
      if (onSave) onSave(returnData, lineItems);
    };

    const isEdit = !!salesReturn;

    // Add log before reference dropdown
    console.log("Reference dropdown value:", selectedReference);

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
              <label className="block text-sm font-medium mb-1">Reference/Original Sale</label>
              <input
                type="text"
                placeholder="Search sale/invoice..."
                className="w-full border rounded px-3 py-2 mb-1"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                disabled={loading}
              />
              <select
                name="reference"
                value={selectedReference}
                onChange={e => onReferenceChange(String(e.target.value))}
                className="w-full border rounded px-3 py-2"
                disabled={loading}
              >
                <option value="">Select sale/invoice</option>
                {filteredOrders.map((o) => {
                  const idStr = String(o.id);
                  return (
                    <option key={idStr} value={idStr}>
                      {o.order_number || idStr}
                    </option>
                  );
                })}
              </select>
              {selectedReference && (
                <a
                  href={`/sales/${selectedReference}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs underline mt-1 inline-block"
                >
                  View Original Sale
                </a>
              )}
            </div>
          </div>
          {/* Line Items Editor comes right after Reference/Original Sale */}
          {children}
          {/* Customer fields, now after line items */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Customer *</label>
              <input
                type="text"
                name="customer_search"
                placeholder="Search customer..."
                className="w-full border rounded px-3 py-2 mb-1"
                onChange={e => {
                  const val = e.target.value;
                  setCustomers((prev) => prev.map(c => ({ ...c, _hidden: val && !c.name.toLowerCase().includes(val.toLowerCase()) })));
                }}
                disabled={loading || !!selectedReference}
              />
              <select
                name="customer_id"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
                disabled={loading || !!selectedReference}
              >
                <option value="">Walk In Customer</option>
                {customers.filter(c => !c._hidden).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {/* Walk In Customer fields */}
              {customerId === "" && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Walk In Customer Name"
                    value={walkInName}
                    onChange={e => setWalkInName(e.target.value)}
                    disabled={loading || !!selectedReference}
                  />
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Walk In Customer Phone"
                    value={walkInPhone}
                    onChange={e => setWalkInPhone(e.target.value)}
                    disabled={loading || !!selectedReference}
                  />
                </div>
              )}
            </div>
            {/* Warehouse field remains */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Warehouse *</label>
              <select
                name="warehouse_id"
                value={form.warehouse_id}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
                disabled={loading}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Status *</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
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
              <label className="block text-sm font-medium mb-1">
                Return Number
              </label>
              <input
                name="return_number"
                type="text"
                value={form.return_number}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                disabled
                placeholder="Auto-generated"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total *</label>
            <input
              name="total"
              type="number"
              min="0"
              step="0.01"
              value={calculatedTotal}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              required
              disabled={true}
              placeholder="Total Amount"
            />
            <div className="text-xs text-gray-500 mt-1">
              Total is auto-calculated from line items.
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
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