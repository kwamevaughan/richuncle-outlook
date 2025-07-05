import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { supabaseClient } from "../lib/supabase";
import SimpleModal from "./SimpleModal";
import toast from "react-hot-toast";

export default function TransferDetailsModal({ 
  isOpen, 
  onClose, 
  transfer, 
  warehouses = [],
  stores = [],
  mode = "light" 
}) {
  const [transferItems, setTransferItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch transfer items when transfer changes
  useEffect(() => {
    if (transfer && isOpen) {
      fetchTransferItems();
    }
  }, [transfer, isOpen]);

  const fetchTransferItems = async () => {
    if (!transfer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabaseClient
        .from("stock_transfer_items")
        .select("*")
        .eq("transfer_id", transfer.id)
        .order("created_at");

      if (error) throw error;
      setTransferItems(data || []);
    } catch (err) {
      setError(err.message || "Failed to load transfer items");
      toast.error("Failed to load transfer items");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", color: "text-yellow-800", icon: "mdi:clock-outline" };
      case "in_transit":
        return { bg: "bg-blue-100", color: "text-blue-800", icon: "mdi:truck-delivery" };
      case "completed":
        return { bg: "bg-green-100", color: "text-green-800", icon: "mdi:check-circle" };
      case "cancelled":
        return { bg: "bg-red-100", color: "text-red-800", icon: "mdi:close-circle" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-800", icon: "mdi:help-circle" };
    }
  };

  const getItemStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", color: "text-yellow-800", icon: "mdi:clock-outline" };
      case "transferred":
        return { bg: "bg-blue-100", color: "text-blue-800", icon: "mdi:truck-delivery" };
      case "received":
        return { bg: "bg-green-100", color: "text-green-800", icon: "mdi:check-circle" };
      case "partial":
        return { bg: "bg-orange-100", color: "text-orange-800", icon: "mdi:alert-circle" };
      case "cancelled":
        return { bg: "bg-red-100", color: "text-red-800", icon: "mdi:close-circle" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-800", icon: "mdi:help-circle" };
    }
  };

  const getLocationName = (type) => {
    if (type === 'source') {
      if (transfer.source_type === 'warehouse') {
        const warehouse = warehouses.find(w => w.id === transfer.source_id);
        return warehouse?.name || 'Unknown Warehouse';
      } else {
        const store = stores.find(s => s.id === transfer.source_id);
        return store?.name || 'Unknown Store';
      }
    } else {
      if (transfer.destination_type === 'warehouse') {
        const warehouse = warehouses.find(w => w.id === transfer.destination_id);
        return warehouse?.name || 'Unknown Warehouse';
      } else {
        const store = stores.find(s => s.id === transfer.destination_id);
        return store?.name || 'Unknown Store';
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalValue = () => {
    return transferItems.reduce((total, item) => {
      return total + (item.unit_price * item.quantity_requested);
    }, 0);
  };

  if (!transfer) return null;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transfer Details - ${transfer.transfer_number}`}
      width="max-w-6xl"
    >
      <div className="space-y-6">
        {/* Transfer Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Transfer Number</div>
              <div className="text-lg font-bold text-gray-900">{transfer.transfer_number}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
              <div className="flex items-center gap-2">
                {(() => {
                  const style = getStatusStyle(transfer.status);
                  return (
                    <>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${style.bg}`}>
                        <Icon icon={style.icon} className={`w-3 h-3 ${style.color}`} />
                      </div>
                      <span className={`font-medium ${style.color}`}>
                        {transfer.status.replace('_', ' ').charAt(0).toUpperCase() + transfer.status.slice(1).replace('_', ' ')}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Transfer Date</div>
              <div className="text-gray-900">{formatDate(transfer.transfer_date)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Expected Delivery</div>
              <div className="text-gray-900">{formatDate(transfer.expected_delivery_date)}</div>
            </div>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source and Destination */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:arrow-up" className="w-5 h-5 text-red-600" />
                Source Location
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Type: </span>
                  <span className="text-gray-900 capitalize">{transfer.source_type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Location: </span>
                  <span className="text-gray-900">{getLocationName('source')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:arrow-down" className="w-5 h-5 text-green-600" />
                Destination Location
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Type: </span>
                  <span className="text-gray-900 capitalize">{transfer.destination_type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Location: </span>
                  <span className="text-gray-900">{getLocationName('destination')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping and Notes */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:truck-delivery" className="w-5 h-5 text-blue-600" />
                Shipping Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Method: </span>
                  <span className="text-gray-900">{transfer.shipping_method || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Tracking: </span>
                  <span className="text-gray-900">{transfer.tracking_number || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Actual Delivery: </span>
                  <span className="text-gray-900">{formatDate(transfer.actual_delivery_date)}</span>
                </div>
              </div>
            </div>

            {transfer.notes && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="mdi:note-text" className="w-5 h-5 text-yellow-600" />
                  Notes
                </h3>
                <p className="text-gray-700">{transfer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Items */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:package-variant" className="w-5 h-5 text-indigo-600" />
              Transfer Items ({transferItems.length})
            </h3>
            <div className="mt-2 text-sm text-gray-500">
              Total Value: GHS {calculateTotalValue().toLocaleString()}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading transfer items...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <Icon icon="mdi:alert-circle" className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : transferItems.length === 0 ? (
            <div className="p-8 text-center">
              <Icon icon="mdi:package-variant-off" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No items found in this transfer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transferred
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transferItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.product_sku}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity_requested}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity_transferred}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity_received}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">GHS {item.unit_price.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const style = getItemStatusStyle(item.status);
                            return (
                              <>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${style.bg}`}>
                                  <Icon icon={style.icon} className={`w-2 h-2 ${style.color}`} />
                                </div>
                                <span className={`text-xs font-medium ${style.color}`}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </SimpleModal>
  );
} 