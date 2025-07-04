import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";

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

const paymentMethods = [
  { key: "cash", label: "Cash", icon: "mdi:cash" },
  { key: "momo", label: "Momo", icon: "mdi:wallet-outline" },
  { key: "card", label: "Card", icon: "mdi:credit-card-outline" },
  { key: "cheque", label: "Cheque", icon: "mdi:checkbook" },
  { key: "split", label: "Split Bill", icon: "mdi:call-split" },
];

const PosOrderList = ({ selectedProducts = [], quantities = {}, products = [], setSelectedProducts, setQuantities, discounts = [] }) => {
  const [selectedPayment, setSelectedPayment] = useState("");
  const [roundoffEnabled, setRoundoffEnabled] = useState(true);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [orderId, setOrderId] = useState("");

  // Generate a unique order ID when component mounts
  useEffect(() => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 100); // 0-99
    setOrderId(`ORD${timestamp}${random.toString().padStart(2, '0')}`);
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

  // Calculate summary
  const subtotal = selectedProducts.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    const qty = quantities[id] || 1;
    return product ? sum + (product.price * qty) : sum;
  }, 0);
  const tax = 0;
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
  const total = subtotal + tax - discount + roundoff;

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
          </label>
          <div className="flex gap-2 mb-2">
            <select className="border rounded px-3 py-2 w-full">
              <option>{dummyOrder.customer.type}</option>
            </select>
            <button className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
              <Icon icon="mdi:account-plus" className="w-5 h-5" />
            </button>
            <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              <Icon icon="mdi:fullscreen" className="w-5 h-5" />
            </button>
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
              <button className="text-xs text-red-400 hover:text-red-600" onClick={handleClearAll}>
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
              <div className="text-gray-400 text-center py-6">No products selected.</div>
            )}
            {selectedProducts.map((id) => {
              const product = products.find(p => p.id === id);
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
                  <div className="text-right font-semibold">GHS {(product.price * qty).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 text-right mt-1">
                    Stock: {product.quantity} | Ordered: {qty}
                    {qty > product.quantity && (
                      <span className="text-red-500 ml-1">⚠️ Exceeds stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Discount Selector */}
          <div className="mt-4 mb-2">
            <label className="block text-xs font-semibold text-purple-700 mb-1 ml-1">Select Discount</label>
            <div className="flex items-center bg-purple-100 border border-purple-300 rounded-xl px-4 py-3 gap-3 relative">
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full p-2">
                  <Icon
                    icon="mdi:brightness-percent"
                    className="w-6 h-6 text-purple-600"
                  />
                </span>
                <div>
                  <div className="font-bold text-purple-700">
                    <select
                      className="bg-transparent font-bold text-purple-700 outline-none"
                      value={selectedDiscountId}
                      onChange={e => setSelectedDiscountId(e.target.value)}
                    >
                      <option value="">Select Discount</option>
                      {discounts.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name || d.label} ({d.type === 'percent' ? `${d.value}%` : `GHS ${d.value}`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-700">
                    {discountLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Payment Summary */}
        <div className="mb-2">
          <div className="font-bold mb-2">Payment Summary</div>
          <div className="flex flex-col gap-1 text-sm">
            
            
            <div className="flex justify-between items-center">
              <span>
                Tax{" "}
                <Icon
                  icon="mdi:pencil"
                  className="inline w-4 h-4 ml-1 text-gray-400 cursor-pointer"
                />
              </span>
              <span>GHS {tax.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-red-500">
                Discount
                <Icon
                  icon="mdi:pencil"
                  className="inline w-4 h-4 ml-1 text-gray-400 cursor-pointer"
                />
              </span>
              <span className="text-red-500">
                -GHS {discount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                 Roundoff
                <span
                  className="relative inline-flex items-center cursor-pointer ml-1"
                  onClick={() => setRoundoffEnabled((v) => !v)}
                  role="switch"
                  aria-checked={roundoffEnabled}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setRoundoffEnabled(v => !v); }}
                >
                  <span
                    className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${roundoffEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out${roundoffEnabled ? ' translate-x-4' : ' translate-x-0'}`}
                    />
                  </span>
                </span>
              </span>
              {roundoffEnabled && (
                <span>+GHS {roundoff.toLocaleString()}</span>
              )}
            </div>
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
      <div className="bg-white rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-4">Select Payment</h3>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.key}
                onClick={() => setSelectedPayment(pm.key)}
                className={`
                  flex flex-row items-center justify-center gap-2 rounded-xl border-2 p-2 font-semibold text-sm transition
                  ${selectedPayment === pm.key
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400"}
                `}
              >
                <Icon icon={pm.icon} className="w-6 h-6" />
                <span>{pm.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

        <div className="flex gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3 font-semibold text-gray-700 hover:bg-gray-100 transition">
            <Icon icon="mdi:printer-outline" className="w-5 h-5" />
            Print Order
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-900 text-white rounded-lg py-3 font-semibold hover:bg-blue-800 transition">
            <Icon icon="mdi:cart-outline" className="w-5 h-5" />
            Place Order
          </button>
      </div>
    </div>
  );
};

export default PosOrderList; 