import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function TaxReport({ dateRange, selectedStore, stores, mode }) {
  const [loading, setLoading] = useState(true);
  const [taxableSales, setTaxableSales] = useState(0);
  const [taxCollected, setTaxCollected] = useState(0);
  const [vatCollected, setVatCollected] = useState(0);
  const [otherTaxCollected, setOtherTaxCollected] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch orders
        const ordersRes = await fetch("/api/orders");
        const ordersJson = await ordersRes.json();
        let orders = ordersJson.data || [];
        // Filter by date and store
        if (dateRange.startDate && dateRange.endDate) {
          orders = orders.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
          });
        }
        if (selectedStore && selectedStore !== "all") {
          orders = orders.filter(order => String(order.register_id) === String(selectedStore));
        }

        // Fetch order items
        const orderItemsRes = await fetch("/api/order-items");
        const orderItemsJson = await orderItemsRes.json();
        let orderItems = orderItemsJson.data || [];
        // Filter by date and store
        if (dateRange.startDate && dateRange.endDate) {
          orderItems = orderItems.filter(item => {
            const orderDate = item.orders && item.orders.timestamp ? new Date(item.orders.timestamp) : null;
            return orderDate && orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
          });
        }
        if (selectedStore && selectedStore !== "all") {
          orderItems = orderItems.filter(item => item.orders && String(item.orders.store_id) === String(selectedStore));
        }

        // Calculate total taxable sales (orders with any tax)
        const taxableOrderIds = new Set(
          orderItems.filter(item => Number(item.item_tax) > 0).map(item => item.order_id)
        );
        const totalTaxableSales = orders
          .filter(order => taxableOrderIds.has(order.id))
          .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        setTaxableSales(totalTaxableSales);

        // Calculate total tax collected
        const totalTax = orderItems.reduce((sum, item) => sum + (parseFloat(item.item_tax) || 0), 0);
        setTaxCollected(totalTax);

        // Breakdown by tax type
        let vat = 0, other = 0;
        orderItems.forEach(item => {
          if (item.tax_type && item.tax_type.toLowerCase().includes("vat")) {
            vat += parseFloat(item.item_tax) || 0;
          } else {
            other += parseFloat(item.item_tax) || 0;
          }
        });
        setVatCollected(vat);
        setOtherTaxCollected(other);
      } catch (err) {
        setError("Failed to load tax data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, selectedStore]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax Report</h2>
        <p className="text-gray-600">
          Tax calculations and reports for {dateRange.label}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Taxable Sales</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${taxableSales.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:cash-register" className="w-8 h-8 text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Tax Collected</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${taxCollected.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:calculator" className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">VAT</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${vatCollected.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:percent" className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Other Taxes</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${otherTaxCollected.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:receipt" className="w-8 h-8 text-gray-200" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tax Summary</h3>
            <Icon icon="mdi:file-document-outline" className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <div className="p-6">
          {error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading tax data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Taxable Sales */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Icon icon="mdi:cash-register" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">Total Taxable Sales</p>
                    <p className="text-xs text-amber-600">Sales subject to tax</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-800">GHS {taxableSales.toLocaleString()}</p>
                </div>
              </div>

              {/* Total Tax Collected */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Icon icon="mdi:calculator" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Tax Collected</p>
                    <p className="text-xs text-blue-600">All taxes combined</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-800">GHS {taxCollected.toLocaleString()}</p>
                </div>
              </div>

              {/* VAT Collected */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Icon icon="mdi:percent" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">VAT Collected</p>
                    <p className="text-xs text-green-600">Value Added Tax</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-800">GHS {vatCollected.toLocaleString()}</p>
                </div>
              </div>

              {/* Other Taxes */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-500 rounded-lg">
                    <Icon icon="mdi:receipt" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Other Taxes</p>
                    <p className="text-xs text-gray-600">Additional tax types</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">GHS {otherTaxCollected.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 