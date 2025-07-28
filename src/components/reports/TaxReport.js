import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import ReportSummary from "./ReportSummary";
import ReportSummaryItem from "./ReportSummaryItem";

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
        <h2 className={`text-2xl font-bold mb-2 ${
          mode === "dark" ? "text-white" : "text-gray-900"
        }`}>Tax Report</h2>
        <p className={`${
          mode === "dark" ? "text-gray-300" : "text-gray-600"
        }`}>
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
      <ReportSummary
        title="Tax Summary"
        icon="mdi:file-document-outline"
        mode={mode}
        loading={loading}
        error={error}
        loadingText="Loading tax data..."
        errorText="Failed to load tax data"
      >
        <ReportSummaryItem
          icon="mdi:cash-register"
          title="Total Taxable Sales"
          subtitle="Sales subject to tax"
          value={`GHS ${taxableSales.toLocaleString()}`}
          color="amber"
          mode={mode}
        />
        <ReportSummaryItem
          icon="mdi:calculator"
          title="Total Tax Collected"
          subtitle="All taxes combined"
          value={`GHS ${taxCollected.toLocaleString()}`}
          color="blue"
          mode={mode}
        />
        <ReportSummaryItem
          icon="mdi:percent"
          title="VAT Collected"
          subtitle="Value Added Tax"
          value={`GHS ${vatCollected.toLocaleString()}`}
          color="green"
          mode={mode}
        />
        <ReportSummaryItem
          icon="mdi:receipt"
          title="Other Taxes"
          subtitle="Additional tax types"
          value={`GHS ${otherTaxCollected.toLocaleString()}`}
          color="gray"
          mode={mode}
        />
      </ReportSummary>
    </div>
  );
} 