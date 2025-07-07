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
  { key: "cheque", label: "Cheque", icon: "mdi:checkbook" },
  { key: "split", label: "Split Bill", icon: "mdi:call-split" },
];

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
  user
}) => {

  const [selectedPayment, setSelectedPayment] = useState("");
  const [orderId, setOrderId] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeQty, setBarcodeQty] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  // Detect if user is on Chrome
  const isChrome = typeof window !== 'undefined' && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  // Generate a unique order ID when component mounts
  useEffect(() => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 100); // 0-99
    setOrderId(`RUO${timestamp}${random.toString().padStart(2, '0')}`);
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

  const handlePaymentSelection = (paymentMethod) => {
    // Clear previous payment data if selecting a different method
    if (paymentData && paymentData.paymentType !== paymentMethod) {
      setPaymentData(null);
    }
    setSelectedPayment(paymentMethod);
    setSelectedPaymentType(paymentMethod);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = (paymentInfo) => {
    // Store payment data for order processing
    setPaymentData(paymentInfo);
    setShowPaymentModal(false);
    
    // Show confirmation message
    if (paymentInfo.paymentType === "split") {
      const totalPaid = paymentInfo.total - paymentInfo.remainingAmount;
      toast.success(`Payment details confirmed! Total: GHS ${totalPaid.toLocaleString()}`);
    } else {
      toast.success(`Payment details confirmed! Amount: GHS ${paymentInfo.payingAmount}`);
    }
  };

  const handleCustomerChange = (selectedCustomer) => {
    if (selectedCustomer) {
      setSelectedCustomerId(selectedCustomer.id);
    } else {
      setSelectedCustomerId("");
    }
  };

  const handlePrintOrder = () => {
    const printReceipt = PrintReceipt({
      orderId,
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

  const processCompleteTransaction = async () => {
    if (!paymentData) {
      toast.error("Please complete payment details first");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please add products to the order");
      return;
    }

    let orderData = null;
    let paymentResult = null;
    let processingToast = null;
    try {
      // Show processing message
      processingToast = toast.loading("Processing payment and creating order...");

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Process payment based on type
      if (paymentData.paymentType === "split") {
        paymentResult = {
          success: true,
          method: "split",
          totalPaid: paymentData.total - paymentData.remainingAmount,
          payments: paymentData.splitPayments
        };
      } else {
        paymentResult = {
          success: true,
          method: paymentData.paymentType,
          amount: parseFloat(paymentData.payingAmount),
          change: paymentData.change,
          reference: paymentData.referenceNumber || null
        };
      }

      // Create order data
      orderData = {
        id: orderId,
        customerId: selectedCustomerId || null,
        customerName: customers.find(c => c.id === selectedCustomerId)?.name || "Walk In Customer",
        items: selectedProducts.map(id => {
          const product = products.find(p => p.id === id);
          const qty = quantities[id] || 1;
          const itemSubtotal = product.price * qty;
          // Calculate item tax
          let itemTax = 0;
          if (product && product.tax_percentage && product.tax_percentage > 0) {
            const taxPercentage = Number(product.tax_percentage);
            if (product.tax_type === 'exclusive') {
              itemTax = (product.price * taxPercentage / 100) * qty;
            } else if (product.tax_type === 'inclusive') {
              const priceWithoutTax = product.price / (1 + taxPercentage / 100);
              itemTax = (product.price - priceWithoutTax) * qty;
            }
          }
          return {
            productId: id,
            name: product.name,
            quantity: qty,
            price: product.price,
            costPrice: product.cost_price || 0,
            taxType: product.tax_type || 'exclusive',
            taxPercentage: product.tax_percentage || 0,
            itemTax: itemTax,
            total: itemSubtotal
          };
        }),
        subtotal,
        tax,
        discount,
        total,
        payment: paymentResult,
        paymentReceiver: paymentData.paymentReceiver,
        paymentReceiverName: user?.full_name || user?.email || 'Unknown',
        paymentNote: paymentData.paymentNote,
        saleNote: paymentData.saleNote,
        staffNote: paymentData.staffNote,
        timestamp: new Date().toISOString()
      };

      // Insert order into 'orders' table
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderData.id,
          customer_id: orderData.customerId,
          customer_name: orderData.customerName,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          discount: orderData.discount,
          total: orderData.total,
          payment_method: orderData.payment.method,
          payment_data: orderData.payment,
          payment_receiver: orderData.paymentReceiver,
          payment_receiver_name: orderData.paymentReceiverName,
          payment_note: orderData.paymentNote,
          sale_note: orderData.saleNote,
          staff_note: orderData.staffNote,
          timestamp: orderData.timestamp
        }),
      });
      const orderResJson = await response.json();
      if (orderResJson.error) throw orderResJson.error;

      // Insert order items into 'order_items' table
      const itemsToInsert = orderData.items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        cost_price: item.costPrice,
        tax_type: item.taxType,
        tax_percentage: item.taxPercentage,
        item_tax: item.itemTax,
        total: item.total
      }));
      const itemsResponse = await fetch('/api/order-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemsToInsert),
      });
      const itemsResJson = await itemsResponse.json();
      if (itemsResJson.error) throw itemsResJson.error;

      // Update stock quantities for each product
      for (const item of orderData.items) {
        const product = products.find(p => p.id === item.productId);
        const newQty = (product?.quantity || 0) - item.quantity;
        const updateResponse = await fetch(`/api/products/${item.productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: newQty }),
        });
        const updateResJson = await updateResponse.json();
        if (updateResJson.error) {
          console.error(`Failed to update stock for product ${item.productId}:`, updateResJson.error.message);
        }
      }

      // Play success sound
      playBellBeep();

      // After order is saved and stock is updated
      if (paymentData.paymentType === 'cash') {
        // Get open session
        const sessionsResponse = await fetch('/api/cash-register-sessions?status=open');
        if (!sessionsResponse.ok) throw new Error('Failed to fetch cash register session');
        const sessions = await sessionsResponse.json();
        const session = sessions && sessions[0];
        if (session && user && user.id) {
          const cashMoveRes = await fetch('/api/cash_movements', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: session.id,
              type: 'sale',
              amount: orderData.total,
              reason: `Order #${orderData.id}`,
              user_id: user.id,
            }),
          });
          if (!cashMoveRes.ok) throw new Error('Failed to record cash movement');
        }
      }

      // Dismiss processing toast
      toast.dismiss(processingToast);

      // Show success modal
      setShowSuccessModal(true);
      setSuccessOrderData(orderData);
      if (typeof onOrderComplete === 'function') onOrderComplete(orderData);

    } catch (error) {
      if (processingToast) toast.dismiss(processingToast);
      console.error("Transaction failed:", error);
      toast.error("Transaction failed. Please try again.");
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
  const total = subtotal + tax - discount + roundoff;

  const { users: allUsers } = useUsers();

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
            <select className="border rounded px-3 py-2 w-full" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
              <option value="">Walk In Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
            <button 
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
              onClick={handleAddCustomer}
            >
              <Icon icon="mdi:account-plus" className="w-5 h-5" />
            </button>
            <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700" onClick={() => setShowBarcodeModal(true)}>
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
                
              </span>
              <span>GHS {tax.toLocaleString()}</span>
            </div>
            
            {tax > 0 && (
              <div className="text-xs text-gray-500 ml-4">
                (Calculated based on product tax rates)
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-red-500">
                Discount
                
              </span>
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
      <div className="bg-white rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Select Payment</h3>
            {paymentData && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Icon icon="mdi:check-circle" className="w-5 h-5" />
                <span className="font-semibold">Payment Details Confirmed</span>
              </div>
            )}
          </div>
                      <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((pm) => {
                const isActive = paymentData ? paymentData.paymentType === pm.key : selectedPayment === pm.key;
                return (
                  <button
                    key={pm.key}
                    onClick={() => handlePaymentSelection(pm.key)}
                    className={`
                      flex flex-row items-center justify-center gap-2 rounded-xl border-2 p-2 font-semibold text-sm transition relative
                      ${isActive
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400"}
                    `}
                  >
                    <Icon icon={pm.icon} className="w-6 h-6" />
                    <span>{pm.label}</span>
                    {paymentData && paymentData.paymentType === pm.key && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Icon icon="mdi:check" className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
        </div>
        
        {/* Payment Summary */}
        {paymentData && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Payment Summary</span>
              </div>
              <button
                onClick={() => {
                  setPaymentData(null);
                  setSelectedPayment("");
                  toast.success("Payment details cleared");
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-green-700">
              {paymentData.paymentType === "split" ? (
                <div>
                  <div>Method: Split Payment</div>
                  <div>Total Paid: GHS {(paymentData.total - paymentData.remainingAmount).toLocaleString()}</div>
                  <div>Payments: {paymentData.splitPayments.map(p => `${getPaymentTypeLabel(p.method)} (GHS ${(parseFloat(p.amount) || 0).toLocaleString()})`).join(', ')}</div>
                </div>
              ) : (
                <div>
                  <div>Method: {paymentData.paymentType === "momo" ? "Mobile Money" : paymentData.paymentType === "cash" ? "Cash" : paymentData.paymentType}</div>
                  <div>Amount: GHS {parseFloat(paymentData.payingAmount).toLocaleString()}</div>
                  {paymentData.change > 0 && (
                    <div>Change: GHS {paymentData.change.toFixed(2)}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        <div className="flex gap-4">
          <button 
            onClick={handlePrintOrder}
            disabled={selectedProducts.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition ${
              selectedProducts.length > 0
                ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Icon icon="mdi:printer-outline" className="w-5 h-5" />
            Print Order
          </button>
          <button 
            onClick={processCompleteTransaction}
            disabled={!paymentData || selectedProducts.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition ${
              paymentData && selectedProducts.length > 0
                ? "bg-blue-900 text-white hover:bg-blue-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Icon icon="mdi:cart-outline" className="w-5 h-5" />
            {paymentData ? "Process Order" : "Place Order"}
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
              const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData),
              });
              const { data, error } = await response.json();
              if (error) throw error;
              setCustomers(prev => [data[0], ...prev]);
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
              onChange={e => {
                const value = e.target.value;
                setBarcodeInput(value);
                setBarcodeError("");
                if (!value.trim()) {
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  return;
                }
                const found = products.find(p => p.barcode === value.trim());
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
                    toast.error(`Cannot add ${qty} units. Only ${found.quantity} units available in stock.`);
                    return;
                  }
                  
                  if (!selectedProducts.includes(found.id)) {
                    setSelectedProducts([...selectedProducts, found.id]);
                    setQuantities(q => ({ ...q, [found.id]: qty }));
                  } else {
                    setQuantities(currentQuantities => {
                      const newQty = (currentQuantities[found.id] || 1) + qty;
                      if (newQty > found.quantity) {
                        toast.error(`Cannot add ${qty} more units. Total would exceed available stock of ${found.quantity} units.`);
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
            {barcodeError && <div className="text-red-500 text-sm">{barcodeError}</div>}
          </div>
          {barcodeProduct && (
            <div className="mt-6 p-4 border rounded bg-gray-50">
              <div className="font-bold mb-2">{barcodeProduct.name}</div>
              <div className="mb-2">Price: GHS {barcodeProduct.price?.toLocaleString()}</div>
              <div className="mb-2">Stock: {barcodeProduct.quantity}</div>
              <div className="mb-2 flex items-center gap-2">
                <span>Quantity:</span>
                <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={() => setBarcodeQty(q => Math.max(1, q - 1))}>-</button>
                <input type="number" min="1" max={barcodeProduct.quantity} value={barcodeQty} onChange={e => setBarcodeQty(Number(e.target.value))} className="w-16 border rounded px-2 py-1" />
                <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={() => setBarcodeQty(q => Math.min(barcodeProduct.quantity, q + 1))}>+</button>
              </div>
              <button
                className="w-full bg-green-600 text-white rounded py-2 font-semibold mt-2"
                onClick={() => {
                  if (barcodeQty > barcodeProduct.quantity) {
                    toast.error(`Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`);
                    return;
                  }
                  
                  if (!selectedProducts.includes(barcodeProduct.id)) {
                    setSelectedProducts([...selectedProducts, barcodeProduct.id]);
                    setQuantities(q => ({ ...q, [barcodeProduct.id]: barcodeQty }));
                  } else {
                    const newQty = (q[barcodeProduct.id] || 1) + barcodeQty;
                    if (newQty > barcodeProduct.quantity) {
                      toast.error(`Cannot add ${barcodeQty} more units. Total would exceed available stock of ${barcodeProduct.quantity} units.`);
                      return;
                    }
                    setQuantities(q => ({ ...q, [barcodeProduct.id]: newQty }));
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
        customer={customers.find(c => c.id === selectedCustomerId)}
        customers={customers}
        onCustomerChange={handleCustomerChange}
        user={user}
        allUsers={allUsers}
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

      {/* Success Modal */}
       {showSuccessModal && successOrderData && (
         <SimpleModal
           isOpen={true}
           onClose={() => {
             setShowSuccessModal(false);
             setSuccessOrderData(null);
             // Reset everything after closing
             setSelectedProducts([]);
             setQuantities({});
             setSelectedDiscountId("");
             setSelectedCustomerId("");
             setPaymentData(null);
             setSelectedPayment("");
             
             // Generate new order ID
             const timestamp = Date.now().toString().slice(-6);
             const random = Math.floor(Math.random() * 100);
             setOrderId(`ORD${timestamp}${random.toString().padStart(2, '0')}`);
           }}
           title="Order Completed Successfully!"
           mode="light"
           width="max-w-lg"
         >
           <div className="space-y-6">
             {/* Success Icon */}
             <div className="flex justify-center">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                 <Icon icon="mdi:check-circle" className="w-10 h-10 text-green-600" />
               </div>
             </div>

             {/* Order Details */}
             <div className="bg-gray-50 rounded-lg p-4 space-y-3">
               <div className="flex justify-between items-center">
                 <span className="text-gray-600">Order ID:</span>
                 <span className="font-semibold">#{successOrderData.id}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600">Customer:</span>
                 <span className="font-semibold">{successOrderData.customerName}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600">Total Amount:</span>
                 <span className="font-semibold text-lg text-blue-700">GHS {successOrderData.total.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600">Payment Method:</span>
                 <span className="font-semibold">
                   {successOrderData.payment.method === "split" 
                     ? "Split Payment" 
                     : successOrderData.payment.method === "momo" 
                     ? "Mobile Money" 
                     : successOrderData.payment.method === "cash" 
                     ? "Cash" 
                     : successOrderData.payment.method}
                 </span>
               </div>
               {successOrderData.payment.method === "split" ? (
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Total Paid:</span>
                   <span className="font-semibold">GHS {successOrderData.payment.totalPaid.toLocaleString()}</span>
                 </div>
               ) : (
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Amount Paid:</span>
                   <span className="font-semibold">GHS {successOrderData.payment.amount.toLocaleString()}</span>
                 </div>
               )}
               {successOrderData.payment.change > 0 && (
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Change:</span>
                   <span className="font-semibold text-green-600">GHS {successOrderData.payment.change.toFixed(2)}</span>
                 </div>
               )}
             </div>

             {/* Action Buttons */}
             <div className="flex gap-3">
               <button
                 onClick={() => {
                   // Get receipt data and show preview modal
                   const printReceipt = PrintReceipt({
                     orderId: successOrderData.id,
                     selectedProducts: successOrderData.items.map(item => item.productId),
                     quantities: successOrderData.items.reduce((acc, item) => {
                       acc[item.productId] = item.quantity;
                       return acc;
                     }, {}),
                     products: successOrderData.items.map(item => ({
                       id: item.productId,
                       name: item.name,
                       price: item.price
                     })),
                     subtotal: successOrderData.subtotal,
                     tax: successOrderData.tax,
                     discount: successOrderData.discount,
                     total: successOrderData.total,
                     selectedCustomerId: successOrderData.customerId,
                     customers: customers,
                     paymentData: {
                       paymentType: successOrderData.payment.method,
                       payingAmount: successOrderData.payment.amount || successOrderData.total,
                       change: successOrderData.payment.change || 0,
                       paymentReceiver: successOrderData.paymentReceiver,
                       paymentReceiverName: successOrderData.paymentReceiverName,
                       total: successOrderData.total,
                       remainingAmount: successOrderData.payment.remainingAmount || 0,
                       splitPayments: successOrderData.payment.payments || []
                     }
                   });

                   const receiptContent = printReceipt.getReceiptContent();
                   if (receiptContent) {
                     setReceiptData(receiptContent);
                     setShowReceiptModal(true);
                     setShowSuccessModal(false);
                   } else {
                     toast.error("Failed to generate receipt");
                   }
                 }}
                 className="flex-1 flex-col bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
               >
                 <Icon icon="mdi:printer" className="w-5 h-5" />
                 Print Receipt
                 {isChrome && <span className="text-xs opacity-75">(Chrome may open new tab)</span>}
               </button>
               <button
                 onClick={() => {
                   setShowSuccessModal(false);
                   setSuccessOrderData(null);
                   // Reset everything after closing
                   setSelectedProducts([]);
                   setQuantities({});
                   setSelectedDiscountId("");
                   setSelectedCustomerId("");
                   setPaymentData(null);
                   setSelectedPayment("");
                   
                   // Generate new order ID
                   const timestamp = Date.now().toString().slice(-6);
                   const random = Math.floor(Math.random() * 100);
                   setOrderId(`ORD${timestamp}${random.toString().padStart(2, '0')}`);
                 }}
                 className="flex-1 bg-gray-500 text-white rounded-lg py-3 font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
               >
                 <Icon icon="mdi:check" className="w-5 h-5" />
                 Continue
               </button>
             </div>
           </div>
         </SimpleModal>
       )}
    </div>
  );
};

export default PosOrderList; 