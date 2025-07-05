import { useState, useEffect } from "react";
import { supabaseClient } from "../lib/supabase";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";

const SalesProfitModal = ({ isOpen, onClose, mode, type }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        if (type === 'sales') {
          // Fetch today's sales
          const { data: orders, error: ordersError } = await supabaseClient
            .from('orders')
            .select('*')
            .gte('timestamp', startOfDay)
            .lte('timestamp', endOfDay)
            .order('timestamp', { ascending: false });

          if (ordersError) throw ordersError;

          const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
          const totalOrders = orders.length;

          setData({
            type: 'sales',
            totalSales,
            totalOrders,
            orders
          });
        } else if (type === 'profit') {
          // Fetch today's profit
          const { data: orderItems, error: itemsError } = await supabaseClient
            .from('order_items')
            .select(`
              *,
              orders!inner(
                timestamp
              )
            `)
            .gte('orders.timestamp', startOfDay)
            .lte('orders.timestamp', endOfDay);

          if (itemsError) throw itemsError;

          const totalProfit = orderItems.reduce((sum, item) => {
            const profit = (Number(item.price) - Number(item.cost_price || 0)) * Number(item.quantity);
            return sum + profit;
          }, 0);

          const totalRevenue = orderItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
          const totalCost = orderItems.reduce((sum, item) => sum + (Number(item.cost_price || 0) * Number(item.quantity)), 0);

          setData({
            type: 'profit',
            totalProfit,
            totalRevenue,
            totalCost,
            orderItems
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, type]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getModalTitle = () => {
    return type === 'sales' ? "Today's Sales" : "Today's Profit";
  };

  const getModalIcon = () => {
    return type === 'sales' ? "mdi:cart-sale" : "hugeicons:chart-increase";
  };

  if (!isOpen) return null;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Icon icon="mdi:loading" className="animate-spin w-8 h-8 text-blue-600" />
            <span className="ml-2 text-gray-600">Loading data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {type === 'sales' ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Icon icon="mdi:currency-usd" className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Total Sales</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatCurrency(data.totalSales)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Icon icon="mdi:receipt" className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <div className="text-sm text-green-600 font-medium">Total Orders</div>
                        <div className="text-2xl font-bold text-green-900">
                          {data.totalOrders}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Icon icon="mdi:chart-line" className="w-8 h-8 text-purple-600 mr-3" />
                      <div>
                        <div className="text-sm text-purple-600 font-medium">Average Order</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {data.totalOrders > 0 ? formatCurrency(data.totalSales / data.totalOrders) : formatCurrency(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Icon icon="hugeicons:chart-increase" className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <div className="text-sm text-green-600 font-medium">Total Profit</div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(data.totalProfit)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Icon icon="mdi:currency-usd" className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Total Revenue</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatCurrency(data.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Icon icon="mdi:currency-usd-off" className="w-8 h-8 text-red-600 mr-3" />
                      <div>
                        <div className="text-sm text-red-600 font-medium">Total Cost</div>
                        <div className="text-2xl font-bold text-red-900">
                          {formatCurrency(data.totalCost)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Details Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {type === 'sales' ? 'Today\'s Orders' : 'Today\'s Sales Items'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {type === 'sales' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profit
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {type === 'sales' ? (
                      data.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customer_name || 'Walk-in Customer'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      data.orderItems.map((item, index) => {
                        const revenue = Number(item.price) * Number(item.quantity);
                        const cost = Number(item.cost_price || 0) * Number(item.quantity);
                        const profit = revenue - cost;
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                              {formatCurrency(revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(cost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(profit)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </SimpleModal>
  );
};

export default SalesProfitModal; 