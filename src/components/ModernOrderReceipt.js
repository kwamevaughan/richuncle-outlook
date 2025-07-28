import React from "react";
import { Icon } from '@iconify/react';
import SimpleModal from './SimpleModal';

const ModernOrderReceipt = ({
  isOpen,
  onClose,
  orderData,
  items = [],
  products = [],
  customers = [],
  onPrint,
  className = "",
}) => {
  if (!isOpen || !orderData) return null;

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `GHS ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      cash: "Cash Payment",
      card: "Card Payment",
      mobile_money: "Mobile Money",
      bank_transfer: "Bank Transfer",
      split: "Split Payment",
    };
    return methods[method] || method || "Cash Payment";
  };

  const customer = customers.find((c) => c.id === orderData.customer_id) || {
    name: orderData.customer_name || "Walk-in Customer",
  };

  const orderItems =
    items.length > 0
      ? items
      : (orderData.items || []).map((item) => ({
          ...item,
          product: products.find((p) => p.id === item.productId) || {
            name: item.name,
          },
        }));

  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (item.price || 0) * (item.quantity || 1);
  }, 0);

  const tax = orderData.tax || 0;
  const discount = orderData.discount || 0;
  const total = orderData.total || subtotal + tax - discount;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Order Complete" width="max-w-lg">
        {/* Receipt Content */}
      <div className={`overflow-y-auto ${className}`}>
        <div className="">
            {/* Order Info Cards */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:barcode" className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Order ID
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-gray-900">
                  {orderData.id}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:calendar" className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Date & Time
                  </span>
                </div>
                <span className="text-sm text-gray-900">
                  {formatDate(orderData.timestamp)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:account" className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Customer
                  </span>
                </div>
                <span className="text-sm text-gray-900">{customer.name}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:credit-card-outline" className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Payment
                  </span>
                </div>
                <div className="text-sm text-gray-900 text-right">
                  {getPaymentMethodDisplay(orderData.payment_method)}
                  {orderData.payment_method === "split" &&
                    Array.isArray(orderData.payment_data?.splitPayments) &&
                    orderData.payment_data.splitPayments.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {orderData.payment_data.splitPayments.map((p, i) => (
                          <div key={i}>
                            {getPaymentMethodDisplay(p.method || p.paymentType)}: GHS{" "}
                            {parseFloat(p.amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {orderData.payment_receiver_name && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Icon icon="mdi:account" className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Cashier
                    </span>
                  </div>
                  <span className="text-sm text-gray-900">
                    {orderData.payment_receiver_name}
                  </span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Icon icon="mdi:receipt" className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Items
                </h3>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 ${
                      index !== orderItems.length - 1
                        ? "border-b border-gray-200"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.product?.name || item.name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Qty: {item.quantity}</span>
                          <span>@{formatCurrency(item.price)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(
                            (item.price || 0) * (item.quantity || 1)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {tax > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-emerald-600">
                  {formatCurrency(total)}
                </span>
              </div>
              {(orderData.change || orderData.payment_data?.change) > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Change</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(orderData.change || orderData.payment_data?.change)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {(orderData.payment_note ||
              orderData.sale_note ||
              orderData.staff_note) && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Notes</h4>
                </div>
                <div className="space-y-2">
                  {orderData.payment_note && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-xs font-medium text-blue-800 uppercase tracking-wide">
                        Payment Note
                      </span>
                      <p className="text-sm text-blue-700 mt-1">
                        {orderData.payment_note}
                      </p>
                    </div>
                  )}
                  {orderData.sale_note && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <span className="text-xs font-medium text-green-800 uppercase tracking-wide">
                        Sale Note
                      </span>
                      <p className="text-sm text-green-700 mt-1">
                        {orderData.sale_note}
                      </p>
                    </div>
                  )}
                  {orderData.staff_note && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <span className="text-xs font-medium text-yellow-800 uppercase tracking-wide">
                        Staff Note
                      </span>
                      <p className="text-sm text-yellow-700 mt-1">
                        {orderData.staff_note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thank you message */}
            <div className="text-center py-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Thank you for your business!
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Please keep this receipt for your records
              </p>
            </div>
          </div>
        </div>
        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex space-x-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
          <Icon icon="mdi:printer" className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-xl font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
    </SimpleModal>
  );
};

export default ModernOrderReceipt;
