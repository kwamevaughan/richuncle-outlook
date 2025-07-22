import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { AddEditModal } from "./AddEditModal";
import SimpleModal from "./SimpleModal";
import PaymentForm from "./PaymentForm";
import PrintReceipt from "./PrintReceipt";
import ReceiptPreviewModal from "./ReceiptPreviewModal";
import { playBellBeep } from "../utils/posSounds";
import { getPaymentTypeLabel } from "./payment/utils/paymentHelpers";
import useUsers from "../hooks/useUsers";
import Select from 'react-select';
import { paymentMethods } from "@/constants/paymentMethods";
import TooltipIconButton from "./TooltipIconButton";

const dummyOrder = {
  id: "ORD123",
  customer: {
    name: "James Anderson",
    type: "Walk in Customer",
  },
  items: [
    { id: 1, name: "iPhone 14 64GB", qty: 1, cost: 15800 },
    { id: 2, name: "Red Nike Angelo", qty: 4, cost: 398 },
    { id: 3, name: "Tablet 1.02 inch", qty: 4, cost: 3000 },
    { id: 4, name: "IdeaPad Slim 3i", qty: 4, cost: 3000 },
  ],
  discount: {
    label: "Discount 5%",
    desc: "For GHS20 Minimum Purchase, all Items",
    value: 15.21,
  },
  summary: {
    tax: 0,
    discount: 0,
    roundoff: 0,
    subtotal: 0,
    total: 0,
  },
};

const PosOrderList = ({ 
  selectedProducts = [], 
  quantities = {}, 
  products = [], 
  setSelectedProducts, 
  setQuantities, 
  discounts = [],
  selectedDiscountId,
  setSelectedDiscountId,
  roundoffEnabled,
  setRoundoffEnabled,
  customers = [],
  setCustomers,
  onOrderComplete,
  user,
  paymentData,
  setPaymentData,
  selectedPayment,
  setSelectedPayment,
  selectedPaymentType,
  setSelectedPaymentType,
  showPaymentModal,
  setShowPaymentModal,
  handlePaymentComplete,
  handleCustomerChange,
  paymentMethods: propPaymentMethods,
  paymentSummary,
  setPaymentSummary,
  showReceiptModal,
  setShowReceiptModal,
  receiptData,
  setReceiptData,
  isOnlinePurchase,
  setIsOnlinePurchase,
  onlineEmail,
  setOnlineEmail,
  onlineOrderRef,
  setOnlineOrderRef,
  allUsers,
  orderId,
}) => {

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeQty, setBarcodeQty] = useState(1);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);
  const [newDiscountName, setNewDiscountName] = useState("");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("percent");
  const [addDiscountLoading, setAddDiscountLoading] = useState(false);
  
  // Detect if user is on Chrome
  const isChrome = typeof window !== 'undefined' && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  // Generate a unique order ID when component mounts
  useEffect(() => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 100); // 0-99
    // setOrderId(`RUO${timestamp}${random.toString().padStart(2, '0')}`); // This line is removed as orderId is now a prop
  }, []);

  const handleQty = (id, delta) => {
    if (!products.length) return;
    const product = products.find(p => p.id === id);
    const qty = Math.max(1, (quantities[id] || 1) + delta);
    
    // Validate against stock
    if (product && qty > product.quantity) {
      toast.error(`Cannot exceed available stock of ${product.quantity} units.`);
      return;
    }
    
    setQuantities(prev => ({ ...prev, [id]: qty }));
  };

  const handleRemove = (id) => {
    setSelectedProducts(prev => prev.filter(pid => pid !== id));
    setQuantities(prev => {
      const q = { ...prev };
      delete q[id];
      return q;
    });
  };

  const handleClearAll = () => {
    setSelectedProducts([]);
    setQuantities({});
  };

  const handleAddCustomer = () => {
    setShowCustomerModal(true);
  };

  const handlePrintOrder = () => {
    const printReceipt = PrintReceipt({
      orderId: orderId, // Use the passed orderId
      selectedProducts,
      quantities,
      products,
      subtotal,
      tax,
      discount,
      total,
      selectedCustomerId,
      customers,
      paymentData
    });

    const success = printReceipt.printOrder();
    if (success) {
      toast.success("Print dialog should open shortly...");
    } else {
      toast.error("No products to print");
    }
  };

  // Calculate summary
  const subtotal = selectedProducts.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    const qty = quantities[id] || 1;
    return product ? sum + (product.price * qty) : sum;
  }, 0);
  
  const totalCost = selectedProducts.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    const qty = quantities[id] || 1;
    return product ? sum + ((product.cost_price || 0) * qty) : sum;
  }, 0);
  
  const totalProfit = subtotal - totalCost;
  
  // Calculate tax based on product tax configuration
  const tax = selectedProducts.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    const qty = quantities[id] || 1;
    if (!product || !product.tax_percentage || product.tax_percentage <= 0) return sum;
    
    const taxPercentage = Number(product.tax_percentage);
    let itemTax = 0;
    
    if (product.tax_type === 'exclusive') {
      // Tax is added on top of the price
      itemTax = (product.price * taxPercentage / 100) * qty;
    } else if (product.tax_type === 'inclusive') {
      // Tax is included in the price, so we need to extract it
      const priceWithoutTax = product.price / (1 + taxPercentage / 100);
      itemTax = (product.price - priceWithoutTax) * qty;
    }
    
    return sum + itemTax;
  }, 0);
  
  let discount = 0;
  let discountLabel = "No discount";
  let discountType = "";
  if (selectedDiscountId) {
    const discountObj = discounts.find(d => d.id === selectedDiscountId);
    if (discountObj) {
      discountLabel = discountObj.name || discountObj.label || "Discount";
      discountType = discountObj.type || "percent";
      if (discountType === "percent") {
        discount = Math.round(subtotal * (Number(discountObj.value) / 100));
      } else {
        discount = Number(discountObj.value);
      }
    }
  }
  const roundoff = roundoffEnabled ? 0 : 0;
  const total = subtotal - discount + roundoff;

  // Find the selected customer object if selectedCustomerId starts with 'db_'
  const selectedDbCustomer = selectedCustomerId.startsWith('db_')
    ? customers.find(c => c.id === selectedCustomerId.replace('db_', ''))
    : null;

  return (
    <div className="w-full md:w-full lg:w-5/12 xl:w-4/12 p-4 gap-6 flex flex-col bg-gray-200 rounded-lg h-screen overflow-auto">
      <div className="bg-white rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Order List</h2>
          <div className="flex items-center gap-2">
            <span className="bg-blue-900 text-white text-xs font-bold rounded-lg px-3 py-1">
              #{orderId}
            </span>
          </div>
        </div>
        {/* Customer Info */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Customer Information
            {selectedDbCustomer && (
              <span className="ml-2 text-blue-700 font-normal">
                - {selectedDbCustomer.name}
              </span>
            )}
          </label>
          <div className="flex gap-2 mb-2">
            <select
              className="border rounded px-3 py-2 w-full"
              value={
                selectedCustomerId.startsWith("db_")
                  ? "customer_db"
                  : selectedCustomerId
              }
              onChange={(e) => {
                if (e.target.value === "__online__") {
                  if (typeof setIsOnlinePurchase === 'function') setIsOnlinePurchase(true);
                  setSelectedCustomerId("__online__");
                } else if (e.target.value === "customer_db") {
                  if (typeof setIsOnlinePurchase === 'function') setIsOnlinePurchase(false);
                  setSelectedCustomerId("customer_db");
                } else {
                  if (typeof setIsOnlinePurchase === 'function') setIsOnlinePurchase(false);
                  setSelectedCustomerId(e.target.value);
                }
              }}
            >
              <option value="">Walk In Customer</option>
              <option value="__online__">Online Purchase</option>
              <option value="customer_db">Customer Database</option>
            </select>
            {/* Show react-select if Customer Database is selected */}
            {selectedCustomerId === "customer_db" && (
              <div className="flex-1 min-w-[200px]">
                <Select
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.name} - ${c.phone}`,
                  }))}
                  onChange={(option) => {
                    setSelectedCustomerId(
                      option ? `db_${option.value}` : "customer_db"
                    );
                  }}
                  isClearable
                  placeholder="Search customer..."
                  classNamePrefix="react-select"
                  autoFocus
                />
              </div>
            )}
            <TooltipIconButton
              label="Add Customer"
              mode="light"
              className="rounded-full text-green-500 p-2 hover:text-green-600"
              onClick={handleAddCustomer}
            >
              <Icon icon="mdi:account-plus" className="w-5 h-5" />
            </TooltipIconButton>
          </div>
        </div>
        {/* Order Details */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold">Order Details</div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-700 text-xs rounded px-2 py-1">
                Items : {selectedProducts.length}
              </span>
              <button
                className="text-xs text-red-400 hover:text-red-600"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            <div className="grid grid-cols-3 bg-gray-50 text-xs font-bold text-gray-600 px-4 py-2">
              <div>Item</div>
              <div className="text-center">QTY</div>
              <div className="text-right">Cost</div>
            </div>
            {selectedProducts.length === 0 && (
              <div className="text-gray-400 text-center py-6">
                No products selected.
              </div>
            )}
            {selectedProducts.map((id) => {
              const product = products.find((p) => p.id === id);
              if (!product) return null;
              const qty = quantities[id] || 1;
              return (
                <div
                  key={id}
                  className="grid grid-cols-3 items-center px-4 py-2 border-t text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:delete-outline"
                      className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
                      onClick={() => handleRemove(id)}
                    />
                    {product.name}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleQty(id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-base font-bold text-gray-500 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 transition"
                    >
                      -
                    </button>
                    <span className="w-6 text-center">{qty}</span>
                    <button
                      onClick={() => handleQty(id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-base font-bold text-gray-500 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 transition"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right font-semibold">
                    GHS {(product.price * qty).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 text-right mt-1">
                    Stock: {product.quantity} | Ordered: {qty}
                    {qty > product.quantity && (
                      <span className="text-red-500 ml-1">
                        ⚠️ Exceeds stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Discount Selector */}
          <div className="mt-4 mb-2">
            <label className="block text-xs font-semibold text-blue-800 mb-1 ml-1">
              Select Discount
            </label>
            <div className="flex items-center bg-blue-100 border border-blue-300 rounded-xl px-4 py-3 gap-3 relative">
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full p-2">
                  <Icon
                    icon="mdi:brightness-percent"
                    className="w-6 h-6 text-blue-800"
                  />
                </span>
                <div>
                  <div className="font-bold text-blue-800 flex items-center gap-2">
                    <select
                      className="bg-transparent font-bold text-blue-800 outline-none"
                      value={selectedDiscountId}
                      onChange={(e) => setSelectedDiscountId(e.target.value)}
                    >
                      <option value="">Select Discount</option>
                      {discounts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name || d.label} (
                          {d.type === "percent"
                            ? `${d.value}%`
                            : `GHS ${d.value}`}
                          )
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ml-2 p-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                      title="Add Discount"
                      onClick={() => setShowAddDiscountModal(true)}
                    >
                      <Icon icon="mdi:plus" className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-700">{discountLabel}</div>
                </div>
              </div>
            </div>
            {/* Add Discount Modal */}
            {showAddDiscountModal && (
              <SimpleModal
                isOpen={showAddDiscountModal}
                onClose={() => setShowAddDiscountModal(false)}
                title="Add Discount"
                width="max-w-md"
              >
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setAddDiscountLoading(true);
                    try {
                      const response = await fetch("/api/discounts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: newDiscountName,
                          value: newDiscountValue,
                          type: newDiscountType,
                          is_active: true,
                        }),
                      });
                      const result = await response.json();
                      if (result.success && result.data && result.data[0]) {
                        setShowAddDiscountModal(false);
                        setNewDiscountName("");
                        setNewDiscountValue("");
                        setNewDiscountType("percent");
                        // Add to discounts list
                        if (typeof setDiscounts === "function") setDiscounts((prev) => [result.data[0], ...prev]);
                        if (typeof setSelectedDiscountId === "function") setSelectedDiscountId(result.data[0].id);
                        toast.success("Discount added!");
                      } else {
                        toast.error(result.error || "Failed to add discount");
                      }
                    } catch (err) {
                      toast.error(err.message || "Failed to add discount");
                    }
                    setAddDiscountLoading(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block font-semibold mb-1">Name</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={newDiscountName}
                      onChange={e => setNewDiscountName(e.target.value)}
                      required
                      placeholder="Discount name"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Value</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      type="number"
                      min="0"
                      value={newDiscountValue}
                      onChange={e => setNewDiscountValue(e.target.value)}
                      required
                      placeholder="Discount value"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Type</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={newDiscountType}
                      onChange={e => setNewDiscountType(e.target.value)}
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="amount">Amount (GHS)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                      onClick={() => setShowAddDiscountModal(false)}
                      disabled={addDiscountLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-700 text-white font-semibold"
                      disabled={addDiscountLoading}
                    >
                      {addDiscountLoading ? "Adding..." : "Add Discount"}
                    </button>
                  </div>
                </form>
              </SimpleModal>
            )}
          </div>
        </div>
        {/* Payment Summary */}
        <div className="mb-2">
          <div className="font-bold mb-2">Payment Summary</div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between items-center">
              <span>Discount</span>
              <span className="text-red-500">
                -GHS {discount.toLocaleString()}
              </span>
            </div>

            {totalProfit > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">
                  Estimated Profit
                </span>
                <span className="text-green-600 font-medium">
                  GHS {totalProfit.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold mt-2">
              <span>Sub Total</span>
              <span>GHS {subtotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="border-t my-2"></div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total Payable</span>
          <span className="text-blue-900">GHS {total.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Section */}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <button
            onClick={() => {
              if (selectedProducts.length > 0) {
                setShowPaymentOptions(true);
              }
            }}
            disabled={selectedProducts.length === 0}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition ${
              selectedProducts.length > 0
                ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Icon icon="mdi:printer-outline" className="w-5 h-5" />
            Select Payment Method
          </button>
          {showPaymentOptions && (
            <div className="absolute bottom-14 left-0 bg-white border rounded-lg shadow-lg p-4 flex gap-4 z-50">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.key}
                  className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-blue-50 rounded transition"
                  onClick={() => {
                    setShowPaymentOptions(false);
                    setSelectedPaymentType(pm.key);
                    setShowPaymentModal(true);
                  }}
                >
                  <Icon icon={pm.icon} className="w-7 h-7 mb-1" />
                  <span className="font-semibold text-sm">{pm.label}</span>
                </button>
              ))}
              <button
                className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-100 rounded transition"
                onClick={() => setShowPaymentOptions(false)}
              >
                <Icon icon="mdi:close" className="w-6 h-6 mb-1 text-gray-500" />
                <span className="text-xs text-gray-500">Cancel</span>
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            // Get receipt data and show preview modal
            const printReceipt = PrintReceipt({
              orderId: orderId,
              selectedProducts: selectedProducts.map((id) => id),
              quantities: quantities,
              products: products.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
              })),
              subtotal: subtotal,
              tax: tax,
              discount: discount,
              total: total,
              selectedCustomerId: selectedCustomerId,
              customers: customers,
              paymentData: {
                paymentType: paymentData.paymentType,
                payingAmount: paymentData.payingAmount || total,
                change: paymentData.change || 0,
                paymentReceiver: paymentData.paymentReceiver,
                paymentReceiverName: paymentData.paymentReceiverName,
                total: total,
                remainingAmount: paymentData.remainingAmount || 0,
                splitPayments: paymentData.splitPayments || [],
              },
            });

            const receiptContent = printReceipt.getReceiptContent();
            if (receiptContent) {
              setReceiptData(receiptContent);
              setShowReceiptModal(true);
            } else {
              toast.error("Failed to generate receipt");
            }
          }}
          disabled={!paymentData || selectedProducts.length === 0}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition ${
            paymentData && selectedProducts.length > 0
              ? "bg-blue-900 text-white hover:bg-blue-800"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Icon icon="mdi:pause" className="w-5 h-5" />
          {paymentData ? "Finalize Order" : "Hold Order"}
        </button>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <AddEditModal
          type="customers"
          mode="light"
          item={null}
          categories={[]}
          onClose={() => setShowCustomerModal(false)}
          onSave={async (customerData) => {
            try {
              const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(customerData),
              });
              const { data, error } = await response.json();
              if (error) throw error;
              setCustomers((prev) => [data[0], ...prev]);
              toast.success("Customer added successfully!");
              setShowCustomerModal(false);
              setSelectedCustomerId(data[0].id); // auto-select new customer
            } catch (err) {
              toast.error(err.message || "Failed to add customer");
            }
          }}
        />
      )}

      {showBarcodeModal && (
        <SimpleModal
          isOpen={true}
          onClose={() => {
            setShowBarcodeModal(false);
            setBarcodeInput("");
            setBarcodeProduct(null);
            setBarcodeError("");
            setBarcodeQty(1);
          }}
          title="Add Product by Barcode"
          mode="light"
          width="max-w-md"
        >
          <div className="space-y-4">
            <label className="block font-semibold">Enter Barcode</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={barcodeInput}
              onChange={(e) => {
                const value = e.target.value;
                setBarcodeInput(value);
                setBarcodeError("");
                if (!value.trim()) {
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  return;
                }
                const found = products.find((p) => p.barcode === value.trim());
                if (!found) {
                  setBarcodeProduct(null);
                  setBarcodeError("No product found with this barcode.");
                } else {
                  setBarcodeProduct(found);
                  setBarcodeQty(quantities[found.id] || 1);
                  setBarcodeError("");

                  // Auto-add product to order list
                  const qty = quantities[found.id] || 1;
                  if (qty > found.quantity) {
                    toast.error(
                      `Cannot add ${qty} units. Only ${found.quantity} units available in stock.`
                    );
                    return;
                  }

                  if (!selectedProducts.includes(found.id)) {
                    setSelectedProducts([...selectedProducts, found.id]);
                    setQuantities((q) => ({ ...q, [found.id]: qty }));
                  } else {
                    setQuantities((currentQuantities) => {
                      const newQty = (currentQuantities[found.id] || 1) + qty;
                      if (newQty > found.quantity) {
                        toast.error(
                          `Cannot add ${qty} more units. Total would exceed available stock of ${found.quantity} units.`
                        );
                        return currentQuantities; // Return unchanged quantities
                      }
                      return { ...currentQuantities, [found.id]: newQty };
                    });
                    return; // Exit early to prevent the success toast and modal close
                  }

                  // Play beep sound and show success message
                  playBellBeep();
                  toast.success(`Added ${found.name} to order list!`);
                  setShowBarcodeModal(false);
                  setBarcodeInput("");
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  setBarcodeQty(1);
                }
              }}
              placeholder="Scan or enter barcode"
              autoFocus
            />
            {barcodeError && (
              <div className="text-red-500 text-sm">{barcodeError}</div>
            )}
          </div>
          {barcodeProduct && (
            <div className="mt-6 p-4 border rounded bg-gray-50">
              <div className="font-bold mb-2">{barcodeProduct.name}</div>
              <div className="mb-2">
                Price: GHS {barcodeProduct.price?.toLocaleString()}
              </div>
              <div className="mb-2">Stock: {barcodeProduct.quantity}</div>
              <div className="mb-2 flex items-center gap-2">
                <span>Quantity:</span>
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() => setBarcodeQty((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={barcodeProduct.quantity}
                  value={barcodeQty}
                  onChange={(e) => setBarcodeQty(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1"
                />
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() =>
                    setBarcodeQty((q) =>
                      Math.min(barcodeProduct.quantity, q + 1)
                    )
                  }
                >
                  +
                </button>
              </div>
              <button
                className="w-full bg-green-600 text-white rounded py-2 font-semibold mt-2"
                onClick={() => {
                  if (barcodeQty > barcodeProduct.quantity) {
                    toast.error(
                      `Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`
                    );
                    return;
                  }

                  if (!selectedProducts.includes(barcodeProduct.id)) {
                    setSelectedProducts([
                      ...selectedProducts,
                      barcodeProduct.id,
                    ]);
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: barcodeQty,
                    }));
                  } else {
                    const newQty = (q[barcodeProduct.id] || 1) + barcodeQty;
                    if (newQty > barcodeProduct.quantity) {
                      toast.error(
                        `Cannot add ${barcodeQty} more units. Total would exceed available stock of ${barcodeProduct.quantity} units.`
                      );
                      return;
                    }
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: newQty,
                    }));
                  }
                  // Play beep sound and show success message
                  playBellBeep();
                  setShowBarcodeModal(false);
                  setBarcodeInput("");
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  setBarcodeQty(1);
                  toast.success("Product added to order list!");
                }}
              >
                Add to Order List
              </button>
            </div>
          )}
        </SimpleModal>
      )}

      {/* Payment Form Modal */}
      <PaymentForm
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment("");
        }}
        paymentType={selectedPaymentType}
        total={total}
        orderId={orderId}
        onPaymentComplete={handlePaymentComplete}
        customer={
          selectedCustomerId === "__online__"
            ? { id: "__online__", name: "Online Purchase" }
            : customers.find((c) => c.id === selectedCustomerId)
        }
        customers={customers}
        onCustomerChange={handleCustomerChange}
        user={allUsers.find((u) => u.id === user?.id) || user}
        allUsers={allUsers}
        isOnlinePurchase={isOnlinePurchase}
        products={products.filter(p => selectedProducts.includes(p.id))}
        quantities={quantities}
      />

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setReceiptData(null);
        }}
        receiptData={receiptData}
      />
    </div>
  );
};

export default PosOrderList; 