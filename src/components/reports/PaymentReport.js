import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PaymentReport({ dateRange, selectedStore, stores, mode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const ordersRes = await fetch("/api/orders");
        const ordersJson = await ordersRes.json();
        let ordersData = ordersJson.data || [];
        
        if (dateRange.startDate && dateRange.endDate) {
          ordersData = ordersData.filter(order => {
            const orderDate = new Date(order.timestamp || order.created_at);
            return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
          });
        }
        if (selectedStore && selectedStore !== "all") {
          ordersData = ordersData.filter(order => String(order.store_id) === String(selectedStore));
        }
        setOrders(ordersData);
      } catch (err) {
        setError("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, selectedStore]);

  // Calculate payment statistics
  const calculatePaymentStats = () => {
    const paymentBreakdown = {};
    const paymentMethods = {};
    let totalRevenue = 0;
    
    orders.forEach(order => {
      const orderAmount = parseFloat(order.total) || 0;
      totalRevenue += orderAmount;
      
      let paymentData = order.payment_data;
      if (typeof paymentData === 'string') {
        try { 
          paymentData = JSON.parse(paymentData); 
        } catch (e) {
          paymentData = null;
        }
      }
      
      if (paymentData && Array.isArray(paymentData.payments)) {
        paymentData.payments.forEach(payment => {
          const method = (payment.method || payment.paymentType || 'other').toLowerCase();
          const amount = parseFloat(payment.amount) || 0;
          
          if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = 0;
            paymentMethods[method] = { total: 0, count: 0 };
          }
          paymentBreakdown[method] += amount;
          paymentMethods[method].total += amount;
          paymentMethods[method].count++;
        });
      } else if (paymentData && (paymentData.paymentType || paymentData.method)) {
        const method = (paymentData.paymentType || paymentData.method || 'other').toLowerCase();
        
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = 0;
          paymentMethods[method] = { total: 0, count: 0 };
        }
        paymentBreakdown[method] += orderAmount;
        paymentMethods[method].total += orderAmount;
        paymentMethods[method].count++;
      } else if (order.payment_method) {
        const method = order.payment_method.toLowerCase();
        
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = 0;
          paymentMethods[method] = { total: 0, count: 0 };
        }
        paymentBreakdown[method] += orderAmount;
        paymentMethods[method].total += orderAmount;
        paymentMethods[method].count++;
      } else {
        if (!paymentBreakdown['other']) {
          paymentBreakdown['other'] = 0;
          paymentMethods['other'] = { total: 0, count: 0 };
        }
        paymentBreakdown['other'] += orderAmount;
        paymentMethods['other'].total += orderAmount;
        paymentMethods['other'].count++;
      }
    });

    
    return { paymentBreakdown, paymentMethods, totalRevenue };
  };

  const { paymentBreakdown, paymentMethods, totalRevenue } = calculatePaymentStats();

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "Cash",
      momo: "Mobile Money",
      card: "Card",
      bank_transfer: "Bank Transfer",
      split: "Split Payment",
      other: "Other"
    };
    return labels[method] || method.charAt(0).toUpperCase() + method.slice(1);
  };

  // Prepare data for payment methods table
  const paymentMethodsData = Object.entries(paymentMethods).map(([method, data]) => {
    const percentage = totalRevenue > 0 ? ((data.total / totalRevenue) * 100).toFixed(1) : 0;
    return {
      method: getPaymentMethodLabel(method),
      total: data.total,
      count: data.count,
      percentage: `${percentage}%`,
      average: data.count > 0 ? (data.total / data.count).toFixed(2) : 0
    };
  });

  // Chart data functions
  const getPaymentMethodsChartData = () => {
    const labels = Object.keys(paymentBreakdown).map(method => getPaymentMethodLabel(method));
    const data = Object.values(paymentBreakdown);
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
    ];
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
      }]
    };
  };

  const getPaymentTrendData = () => {
    const dailyPayments = {};
    orders.forEach(order => {
      const date = new Date(order.timestamp || order.created_at).toLocaleDateString();
      if (!dailyPayments[date]) {
        dailyPayments[date] = {};
      }
      let paymentData = order.payment_data;
      if (typeof paymentData === 'string') {
        try { paymentData = JSON.parse(paymentData); } catch {}
      }
      const orderAmount = parseFloat(order.total) || 0;
      if (paymentData && Array.isArray(paymentData.payments)) {
        paymentData.payments.forEach(payment => {
          const method = (payment.method || payment.paymentType || 'other').toLowerCase();
          const amount = parseFloat(payment.amount) || 0;
          if (!dailyPayments[date][method]) dailyPayments[date][method] = 0;
          dailyPayments[date][method] += amount;
        });
      } else if (paymentData && (paymentData.paymentType || paymentData.method)) {
        const method = (paymentData.paymentType || paymentData.method || 'other').toLowerCase();
        if (!dailyPayments[date][method]) dailyPayments[date][method] = 0;
        dailyPayments[date][method] += orderAmount;
      } else if (order.payment_method) {
        const method = order.payment_method.toLowerCase();
        if (!dailyPayments[date][method]) dailyPayments[date][method] = 0;
        dailyPayments[date][method] += orderAmount;
      } else {
        if (!dailyPayments[date]['other']) dailyPayments[date]['other'] = 0;
        dailyPayments[date]['other'] += orderAmount;
      }
    });
    const dates = Object.keys(dailyPayments).sort();
    const allMethods = Array.from(new Set(Object.values(dailyPayments).flatMap(obj => Object.keys(obj))));
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
    ];
    return {
      labels: dates,
      datasets: allMethods.map((method, idx) => ({
        label: getPaymentMethodLabel(method),
        data: dates.map(date => dailyPayments[date][method] || 0),
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length] + '33',
        tension: 0.4,
      }))
    };
  };

  // Table columns for payment methods
  const paymentMethodsColumns = [
    { Header: "Payment Method", accessor: "method" },
    { Header: "Total Amount", accessor: "total", render: (row) => `GHS ${row.total.toLocaleString()}` },
    { Header: "Transaction Count", accessor: "count" },
    { Header: "Percentage", accessor: "percentage" },
    { Header: "Average Amount", accessor: "average", render: (row) => `GHS ${row.average}` }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          <Icon icon="mdi:alert-circle" className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">

      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Analytics</h2>
        <p className="text-gray-600">
          Payment methods breakdown and transaction analysis for {dateRange.label}
        </p>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Distribution</h3>
          <div className="h-80">
            <Doughnut
              data={getPaymentMethodsChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: GHS ${value.toLocaleString()} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Payment Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Trends</h3>
          <div className="h-80">
            <Line
              data={getPaymentTrendData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: GHS ${context.parsed.y.toLocaleString()}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'GHS ' + value.toLocaleString();
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="mt-4">

        <GenericTable
          data={paymentMethodsData}
          columns={paymentMethodsColumns}
          title="Payment Methods Breakdown"
          emptyMessage="No payment data available"
          selectable={false}
          searchable={true}
          enableDateFilter={false}
          exportType="payment-methods"
          exportTitle="Export Payment Methods Data"
          getFieldsOrder={() => [
            { label: "Payment Method", key: "method", icon: "mdi:credit-card" },
            { label: "Total Amount", key: "total", icon: "mdi:currency-usd" },
            { label: "Transaction Count", key: "count", icon: "mdi:counter" },
            { label: "Percentage", key: "percentage", icon: "mdi:percent" },
            { label: "Average Amount", key: "average", icon: "mdi:calculator" }
          ]}
          getDefaultFields={() => ({
            method: true,
            total: true,
            count: true,
            percentage: true,
            average: true
          })}
        />
      </div>
    </div>
  );
} 