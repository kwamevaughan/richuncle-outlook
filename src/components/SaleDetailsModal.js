import React, { useEffect, useState } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import StatusPill from "./StatusPill";
import ModernOrderReceipt from './ModernOrderReceipt';
import PrintReceipt from './PrintReceipt';
import { createPortal } from 'react-dom';

export default function SaleDetailsModal({ sale, isOpen, onClose, mode, products = [], customers = [] }) {
  const [items, setItems] = useState(sale?.items || []);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0.00';
    // If value is already a string with GHS, just return the number part
    if (typeof value === 'string' && value.includes('GHS')) {
      return value.replace('GHS', '').trim();
    }
    // Otherwise format the number
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  useEffect(() => {
    let ignore = false;
    async function fetchItems() {
      if (sale && (!sale.items || sale.items.length === 0)) {
        const res = await fetch(`/api/order-items?order_id=${sale.id}`);
        const result = await res.json();
        if (!ignore && result.success) {
          setItems(result.data || []);
        }
      } else if (sale && sale.items) {
        setItems(sale.items);
      }
    }
    if (isOpen && sale) fetchItems();
    return () => { ignore = true; };
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;


  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { bg: 'bg-green-100', color: 'text-green-800', icon: 'mdi:check-circle' };
      case 'pending':
        return { bg: 'bg-yellow-100', color: 'text-yellow-800', icon: 'mdi:clock-outline' };
      case 'cancelled':
        return { bg: 'bg-red-100', color: 'text-red-800', icon: 'mdi:close-circle' };
      default:
        return { bg: 'bg-gray-100', color: 'text-gray-800', icon: 'mdi:help-circle' };
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return 'mdi:cash';
      case 'card':
        return 'mdi:credit-card';
      case 'mobile money':
        return 'mdi:cellphone';
      default:
        return 'mdi:payment';
    }
  };

  return (
    <>
      <SimpleModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Sale #${sale.sale_number || sale.id}`} 
        mode={mode} 
        width="max-w-4xl"
      >
        <div className="space-y-8">
          {/* Header Card */}
          <div className={`rounded-xl p-6 shadow-sm border ${
            mode === "dark" 
              ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-700" 
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex flex-col items-center md:items-start gap-3 min-w-[100px]">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Icon icon="mdi:cart-check" className="w-8 h-8 text-white" />
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  mode === "dark" 
                    ? "bg-blue-900/50 text-blue-300" 
                    : "bg-blue-100 text-blue-800"
                }`}>
                  Sale
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono ${
                    mode === "dark" 
                      ? "bg-gray-700 text-gray-300" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    <Icon icon="mdi:identifier" className="w-4 h-4" />
                    #{sale.sale_number || sale.id}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                    mode === "dark" 
                      ? "bg-gray-700 text-gray-300" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    <Icon icon="mdi:calendar" className="w-4 h-4" />
                    {sale.timestamp ? new Date(sale.timestamp).toLocaleString() : "-"}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${getStatusStyle(sale.status).bg} ${getStatusStyle(sale.status).color}`}>
                    <Icon icon={getStatusStyle(sale.status).icon} className="w-4 h-4" />
                    {sale.status?.charAt(0).toUpperCase() + sale.status?.slice(1) || "Unknown"}
                  </div>
                </div>
                <div className={`text-xl font-bold ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Sale to {sale.customer_name || "Walk In Customer"}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer & Payment Info */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className={`rounded-xl p-6 shadow-sm border ${
                mode === "dark" 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-white border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  <Icon icon="mdi:account" className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mode === "dark" ? "bg-blue-900/50" : "bg-blue-100"
                    }`}>
                      <Icon icon="mdi:account" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className={`font-semibold ${
                        mode === "dark" ? "text-white" : "text-gray-900"
                      }`}>{sale.customer_name || "Walk In Customer"}</div>
                      <div className={`text-sm ${
                        mode === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>{sale.customer_email || "No email provided"}</div>
                    </div>
                  </div>
                  {sale.customer_phone && (
                    <div className={`flex items-center gap-2 text-sm ${
                      mode === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>
                      <Icon icon="mdi:phone" className="w-4 h-4" />
                      {sale.customer_phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className={`rounded-xl p-6 shadow-sm border ${
                mode === "dark" 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-white border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  <Icon icon="mdi:credit-card" className="w-5 h-5 text-green-600" />
                  Payment Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mode === "dark" ? "bg-green-900/50" : "bg-green-100"
                    }`}>
                      <Icon icon={getPaymentMethodIcon(sale.payment_method)} className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className={`font-semibold capitalize ${
                        mode === "dark" ? "text-white" : "text-gray-900"
                      }`}>{sale.payment_method || "Not specified"}</div>
                      <div className={`text-sm ${
                        mode === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>Payment method</div>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}>
                    <div className={`text-sm mb-1 ${
                      mode === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>Total Amount</div>
                    <div className={`text-2xl font-bold ${
                      mode === "dark" ? "text-white" : "text-gray-900"
                    }`}>GHS {Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-6">
              <div className={`rounded-xl p-6 shadow-sm border ${
                mode === "dark" 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-white border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  <Icon icon="mdi:calculator" className="w-5 h-5 text-purple-600" />
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className={`flex justify-between items-center py-2 border-b ${
                    mode === "dark" ? "border-gray-700" : "border-gray-100"
                  }`}>
                    <span className={`${
                      mode === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>Subtotal</span>
                    <span className={`font-semibold ${
                      mode === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {`GHS ${Number(sale.subtotal || sale.total).toFixed(2)}`}
                    </span>
                  </div>
                  {((sale.tax !== undefined && sale.tax !== null && sale.tax !== '' && Number(sale.tax) > 0) || 
                    (sale.discount !== undefined && sale.discount !== null && sale.discount !== '' && Number(sale.discount) > 0)) && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                      mode === "dark" ? "border-gray-700" : "border-gray-100"
                    }`}>
                      <span className={`${
                        mode === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}>
                        {sale.tax ? 'Tax' : 'Discount'}
                      </span>
                      <span className={`font-semibold ${
                        sale.discount ? 'text-red-600' : mode === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {sale.tax 
                          ? `GHS ${Number(sale.tax).toFixed(2)}`
                          : `-GHS ${Number(sale.discount).toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className={`font-semibold ${
                      mode === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>Total</span>
                    <span className={`text-xl font-bold ${
                      mode === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {`GHS ${Number(sale.total).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Staff Information */}
              {sale.payment_receiver_name && (
                <div className={`rounded-xl p-6 shadow-sm border ${
                  mode === "dark" 
                    ? "bg-gray-800 border-gray-700" 
                    : "bg-white border-gray-200"
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    mode === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    <Icon icon="mdi:account-tie" className="w-5 h-5 text-indigo-600" />
                    Cashier Information
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mode === "dark" ? "bg-indigo-900/50" : "bg-indigo-100"
                    }`}>
                      <Icon icon="mdi:account-tie" className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className={`font-semibold ${
                        mode === "dark" ? "text-white" : "text-gray-900"
                      }`}>{sale.payment_receiver_name}</div>
                      <div className={`text-sm ${
                        mode === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>Payment receiver</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-6">
              <div className={`rounded-xl p-6 shadow-sm border ${
                mode === "dark" 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-white border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  <Icon icon="mdi:package-variant" className="w-5 h-5 text-orange-600" />
                  Items ({items.length})
                </h3>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className={`text-center py-8 ${
                      mode === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}>
                      <Icon icon="mdi:package-variant-off" className="w-12 h-12 mx-auto mb-2" />
                      <div>No items found</div>
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${
                        mode === "dark" ? "bg-gray-700" : "bg-gray-50"
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          mode === "dark" ? "bg-orange-900/50" : "bg-orange-100"
                        }`}>
                          <Icon icon="mdi:package-variant" className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            mode === "dark" ? "text-white" : "text-gray-900"
                          }`}>{item.name || item.product_name || item.product_id}</div>
                          <div className={`text-sm ${
                            mode === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>
                            {item.quantity} × GHS {formatCurrency(item.price || item.unit_price)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            mode === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            GHS {formatCurrency(item.total || ((Number(item.quantity) || 0) * (Number(item.price || item.unit_price) || 0)))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                mode === "dark" 
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setShowReceiptModal(true)}
            >
              <Icon icon="mdi:printer" className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </SimpleModal>
      {showReceiptModal && createPortal(
        <ModernOrderReceipt
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          orderData={sale}
          items={items}
          products={products}
          customers={customers}
          onPrint={() => {
            PrintReceipt({
              orderId: sale.id,
              selectedProducts: items.map(item => item.product_id || item.productId),
              quantities: items.reduce((acc, item) => {
                acc[item.product_id || item.productId] = item.quantity;
                return acc;
              }, {}),
              products: products,
              subtotal: sale.subtotal || 0,
              tax: sale.tax || 0,
              discount: sale.discount || 0,
              total: sale.total || 0,
              selectedCustomerId: sale.customer_id,
              customers: customers,
              paymentData: sale.payment_data || sale.payment || {},
              order: sale,
            }).printOrder();
          }}
        />,
        document.body
      )}
    </>
  );
} 