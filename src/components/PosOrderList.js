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
import Select, { components } from 'react-select';
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
  setDiscounts,
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
  className = "",
  mode = "light",
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
  const [discountPlans, setDiscountPlans] = useState([]);
  const [discountValue, setDiscountValue] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("percentage");
  
  // Detect if user is on Chrome
  const isChrome = typeof window !== 'undefined' && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  // Generate a unique order ID when component mounts
  useEffect(() => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 100); // 0-99
    // setOrderId(`RUO${timestamp}${random.toString().padStart(2, '0')}`); // This line is removed as orderId is now a prop
  }, []);

  // Fetch discount plans
  useEffect(() => {
    fetch('/api/discount-plans')
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          setDiscountPlans(result.data || []);
        }
      })
      .catch(err => {
        console.error("Failed to fetch discount plans:", err);
      });
  }, []);

  const handleQty = (id, delta) => {
    if (!products.length) return;
    const product = products.find(p => p.id === id);
    const qty = Math.max(1, (quantities[id] || 1) + delta);
    
    // Validate against stock
    if (product && qty > product.quantity) {
      toast.error(user?.role === "cashier" ? "Cannot exceed available stock." : `Cannot exceed available stock of ${product.quantity} units.`);
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

  const productOptions = React.useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.name,
        product,
      })),
    [products]
  );

  const ProductOption = (props) => {
    const { product } = props.data;
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{product.name}</div>
            <div className="text-xs text-gray-500">GHS {product.price}</div>
          </div>
          {user?.role !== "cashier" && (
            <div className="text-xs text-gray-400">
              Stock: {product.quantity}
            </div>
          )}
        </div>
      </components.Option>
    );
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
      discountType = discountObj.discount_type || discountObj.type || "percentage";
      if (discountType === "percentage") {
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
    <div
      className={`p-4 gap-6 flex flex-col ${
        mode === "dark" ? "bg-gray-800" : "bg-gray-200"
      } rounded-lg overflow-auto ${className}`}
    >
      <div
        className={`${
          mode === "dark" ? "bg-gray-900" : "bg-white"
        } rounded-lg p-6`}
      >
        {/* Header */}

        {/* Customer Info */}

        <div className="flex justify-start mb-2  gap-6">
          {/* <label
              className={`block font-semibold mb-1 ${
                mode === "dark" ? "text-white" : "text-black"
              }`}
            >
              Customer Information
              {selectedDbCustomer && (
                <span
                  className={`ml-2 font-normal ${
                    mode === "dark" ? "text-blue-400" : "text-blue-700"
                  }`}
                >
                  - {selectedDbCustomer.name}
                </span>
              )}
            </label> */}
          <div className="flex gap-2 rounded-full border px-4">
            <TooltipIconButton
              label="Add Customer"
              mode="light"
              className="rounded-full text-green-500 p-2 hover:text-green-600"
              onClick={handleAddCustomer}
            >
              <Icon icon="mdi:account-plus" className="w-5 h-5" />
            </TooltipIconButton>
            <select
              className={`px-3  w-full ${
                mode === "dark"
                  ? "bg-gray-800 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              }`}
              value={
                selectedCustomerId.startsWith("db_")
                  ? "customer_db"
                  : selectedCustomerId
              }
              onChange={(e) => {
                if (e.target.value === "__online__") {
                  if (typeof setIsOnlinePurchase === "function")
                    setIsOnlinePurchase(true);
                  setSelectedCustomerId("__online__");
                } else if (e.target.value === "customer_db") {
                  if (typeof setIsOnlinePurchase === "function")
                    setIsOnlinePurchase(false);
                  setSelectedCustomerId("customer_db");
                } else {
                  if (typeof setIsOnlinePurchase === "function")
                    setIsOnlinePurchase(false);
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
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-[2] min-w-[500px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon
                  icon="material-symbols:search-rounded"
                  className="w-5 h-5"
                />
              </span>
              <div className="w-full">
                <Select
                  options={productOptions}
                  components={{ Option: ProductOption }}
                  placeholder="Search / select product..."
                  isClearable
                  isSearchable
                  // menuIsOpen removed to allow default open/close behavior
                  onFocus={() => {
                    /* Optionally, you can set a local state to control open if needed */
                  }}
                  onChange={(option) => {
                    if (option && option.product) {
                      toggleProductSelect(option.product.id);
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "1rem",
                      minHeight: "38px",
                      paddingLeft: "2.5rem",
                      fontSize: "1rem",
                      boxShadow: "none",
                      borderColor: mode === "dark" ? "#4b5563" : "#cbd5e1",
                      backgroundColor: mode === "dark" ? "transparent" : "#fff",
                      color: mode === "dark" ? "#f9fafb" : "#222",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 100,
                      maxHeight: 320,
                      backgroundColor: mode === "dark" ? "#374151" : "#fff",
                      border:
                        mode === "dark"
                          ? "1px solid #4b5563"
                          : "1px solid #e5e7eb",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused
                        ? mode === "dark"
                          ? "#4b5563"
                          : "#e0f2fe"
                        : mode === "dark"
                        ? "#374151"
                        : "#fff",
                      color: mode === "dark" ? "#f9fafb" : "#222",
                      cursor: "pointer",
                      padding: "12px 16px",
                      fontSize: "1rem",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: mode === "dark" ? "#f9fafb" : "#222",
                    }),
                    input: (base) => ({
                      ...base,
                      color: mode === "dark" ? "#f9fafb" : "#222",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: mode === "dark" ? "#9ca3af" : "#6b7280",
                    }),
                  }}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Icon
                    icon="material-symbols:search-rounded"
                    className="w-5 h-5"
                  />
                </span>
              </div>
            </div>

            {/* <TooltipIconButton
              label="Open Barcode Scanner"
              mode={mode}
              className={`ml-2 p-3 rounded-2xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation active:scale-95 ${
                mode === "dark"
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
                  : "bg-white hover:bg-blue-50 border-gray-300"
              }`}
              onClick={() => setShowBarcodeModal(true)}
            >
              <Icon icon="tabler:barcode" className="w-6 h-6" />
            </TooltipIconButton> */}

            {/* <TooltipIconButton
              label="Refresh Product List"
              mode={mode}
              className={`ml-2 p-3 rounded-2xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation active:scale-95 ${
                mode === "dark"
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
                  : "bg-white hover:bg-blue-50 border-gray-300"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.loading("Refreshing products...", {
                  id: "reload-products",
                });
                setReloadFlag((f) => f + 1);
              }}
            >
              <Icon
                icon="material-symbols:refresh"
                className={`w-6 h-6 ${
                  mode === "dark" ? "text-blue-400" : "text-blue-800"
                }`}
              />
            </TooltipIconButton> */}
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {/* <div
              className={`font-bold ${
                mode === "dark" ? "text-white" : "text-black"
              }`}
            >
              Order Details
            </div> */}
          </div>
          <div
            className={`border rounded-lg overflow-hidden max-h-[500px] h-[300px] overflow-y-auto ${
              mode === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <div
              className={`grid grid-cols-4 items-center text-sm font-bold px-4 py-2 ${
                mode === "dark"
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <div>Item</div>
              <div className="text-center">Quantity</div>
              <div className="text-right">Sub Total</div>
              <div
                className="text-center flex items-center justify-center cursor-pointer"
                onClick={handleClearAll}
              >
                <Icon
                  icon="ic:baseline-clear"
                  className={`w-8 h-8 ${
                    mode === "dark" ? "text-gray-300" : ""
                  }`}
                />
              </div>
            </div>
            {selectedProducts.length === 0 && (
              <div
                className={`text-center py-6 ${
                  mode === "dark" ? "text-gray-500" : "text-gray-400"
                }`}
              >
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
                  className={`grid grid-cols-4 items-center px-4 py-2 border-t text-sm ${
                    mode === "dark" ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={mode === "dark" ? "text-white" : "text-black"}
                    >
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleQty(id, -1)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-base font-bold transition ${
                        mode === "dark"
                          ? "text-gray-400 bg-gray-700 hover:bg-blue-600 hover:text-white"
                          : "text-gray-500 bg-gray-100 hover:bg-blue-100 hover:text-blue-700"
                      }`}
                    >
                      -
                    </button>
                    <span
                      className={`w-6 text-center ${
                        mode === "dark" ? "text-white" : "text-black"
                      }`}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQty(id, 1)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-base font-bold transition ${
                        mode === "dark"
                          ? "text-gray-400 bg-gray-700 hover:bg-blue-600 hover:text-white"
                          : "text-gray-500 bg-gray-100 hover:bg-blue-100 hover:text-blue-700"
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div
                    className={`text-right font-semibold ${
                      mode === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    GHS {(product.price * qty).toLocaleString()}
                  </div>
                  <div className="flex items-center justify-center">
                    <Icon
                      icon="ic:baseline-clear"
                      className={`w-8 h-8 cursor-pointer ${
                        mode === "dark"
                          ? "text-gray-500 hover:text-red-400"
                          : "text-red-600 hover:text-red-500"
                      }`}
                      onClick={() => handleRemove(id)}
                    />
                  </div>

                  <div
                    className={`text-xs mt-1 col-span-4 ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user?.role !== "cashier" && (
                      <>Stock: {product.quantity} |</>
                    )}
                    {/* Ordered: {qty} */}
                    {qty > product.quantity && user?.role !== "cashier" && (
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

          {/* Add Discount Modal */}
          {showAddDiscountModal && (
            <SimpleModal
              isOpen={true}
              onClose={() => setShowAddDiscountModal(false)}
              title="Quick Discount"
              mode="light"
              width="max-w-md"
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      newDiscountType === "percentage" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setNewDiscountType("percentage")}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      newDiscountType === "fixed" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setNewDiscountType("fixed")}
                  >
                    Fixed Amount
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">
                    {newDiscountType === "percentage" ? "Discount Percentage" : "Discount Amount (GHS)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={newDiscountType === "percentage" ? "100" : "999999"}
                    step={newDiscountType === "percentage" ? "0.1" : "0.01"}
                    className="w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={newDiscountType === "percentage" ? "e.g., 10" : "e.g., 50"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    autoFocus
                  />
                </div>

                {discountValue && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      {newDiscountType === "percentage" ? (
                        <>
                          <span className="font-semibold">{discountValue}%</span> off = 
                          <span className="font-semibold text-red-600"> -GHS {((subtotal * Number(discountValue)) / 100).toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">GHS {discountValue}</span> off
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    onClick={() => setShowAddDiscountModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!discountValue || Number(discountValue) <= 0}
                    onClick={async () => {
                      try {
                        const discountData = {
                          name: `${newDiscountType === "percentage" ? discountValue + "%" : "GHS " + discountValue} Discount`,
                          value: Number(discountValue),
                          discount_type: newDiscountType,
                          store_id: user?.store_id || null,
                        };

                        const response = await fetch("/api/discounts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(discountData),
                        });
                        const result = await response.json();

                        if (result.success && result.data) {
                          setShowAddDiscountModal(false);
                          setDiscountValue("");
                          setNewDiscountType("percentage");

                          // Add to discounts list
                          if (typeof setDiscounts === "function") {
                            setDiscounts((prev) => [result.data, ...prev]);
                          }

                          if (typeof setSelectedDiscountId === "function") {
                            setSelectedDiscountId(result.data.id);
                          }

                          toast.success("Discount applied!");
                        } else {
                          toast.error(result.error || "Failed to apply discount");
                        }
                      } catch (err) {
                        toast.error(err.message || "Failed to apply discount");
                      }
                    }}
                  >
                    Apply Discount
                  </button>
                </div>
              </div>
            </SimpleModal>
          )}
        </div>
        {/* Payment Summary */}
        <div className="mb-2">
          {/* <div
            className={`font-bold mb-2 ${
              mode === "dark" ? "text-white" : "text-black"
            }`}
          >
            Payment Summary
          </div> */}

          <div className="flex justify-center gap-40 items-center">
            <div
              className={`flex justify-between items-center text-lg font-semibold ${
                mode === "dark" ? "text-gray-400" : "text-black"
              }`}
            >
              <span>Items: {selectedProducts.length}</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className={mode === "dark" ? "text-white" : "flex items-center justify-center text-black"}>
                  Discount: [
                  {selectedDiscountId ? (
                    <Icon 
                      icon="ic:baseline-minus" 
                      className="w-5 h-5 cursor-pointer text-black hover:text-red-700" 
                      onClick={() => {
                        setSelectedDiscountId("");
                        toast.success("Discount removed!");
                      }} 
                    />
                  ) : (
                    <Icon 
                      icon="ic:baseline-plus" 
                      className="w-5 h-5 cursor-pointer" 
                      onClick={() => setShowAddDiscountModal(true)} 
                    />
                  )}
                  ]
                  {""}
                </span>
                <span className="ml-2 text-red-500">
                  - GHS {discount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className={mode === "dark" ? "text-white" : "text-black"}>
                Total: {""}
              </span>
              <span className="ml-2 text-blue-900">
                GHS {total.toLocaleString()}
              </span>
            </div>

            {totalProfit > 0 && user?.role !== "cashier" && (
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">
                  Estimated Profit
                </span>
                <span className="text-green-600 font-medium">
                  GHS {totalProfit.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div
          className={`border-t my-2 ${
            mode === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        ></div>
      </div>

      {/* Payment Section */}

      <div className="grid grid-cols-3 gap-3">
        {paymentMethods.map((pm) => {
          const getButtonStyle = () => {
            if (selectedProducts.length === 0) {
              return "bg-gray-300 text-gray-500 cursor-not-allowed";
            }

            switch (pm.key) {
              case "cash":
                return "bg-green-500 border border-green-600 text-white hover:bg-green-600";
              case "momo":
                return "bg-blue-500 border border-blue-600 text-white hover:bg-blue-600";
              case "split":
                return "bg-orange-400 border border-orange-600 text-white hover:bg-orange-500";
              default:
                return "bg-blue-500 border border-blue-600 text-white hover:bg-blue-600";
            }
          };

          return (
            <button
              key={pm.key}
              onClick={() => {
                if (selectedProducts.length > 0) {
                  setSelectedPaymentType(pm.key);
                  setShowPaymentModal(true);
                }
              }}
              disabled={selectedProducts.length === 0}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg py-4 font-semibold transition ${getButtonStyle()}`}
            >
              <Icon icon={pm.icon} className="w-8 h-8" />
              <span className="text-sm font-bold">{pm.label}</span>
            </button>
          );
        })}
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
                      user?.role === "cashier"
                        ? "Cannot add items. Insufficient stock."
                        : `Cannot add ${qty} units. Only ${found.quantity} units available in stock.`
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
                          user?.role === "cashier"
                            ? "Cannot add more items. Insufficient stock."
                            : `Cannot add ${qty} more units. Total would exceed available stock of ${found.quantity} units.`
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
              {user?.role !== "cashier" && (
                <div className="mb-2">Stock: {barcodeProduct.quantity}</div>
              )}
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
                      user?.role === "cashier"
                        ? "Cannot add items. Insufficient stock."
                        : `Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`
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
        products={products.filter((p) => selectedProducts.includes(p.id))}
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