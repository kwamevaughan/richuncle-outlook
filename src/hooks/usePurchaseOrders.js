import { useState, useCallback } from "react";

export default function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-orders");
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setPurchaseOrders(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch purchase orders");
    } finally {
      setLoading(false);
    }
  }, []);

  const addPurchaseOrder = async (order) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setPurchaseOrders((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message || "Failed to add purchase order");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseOrder = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      await fetchPurchaseOrders();
      return data;
    } catch (err) {
      setError(err.message || "Failed to update purchase order");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePurchaseOrder = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const { error } = await response.json();
      if (error) throw new Error(error);
      await fetchPurchaseOrders();
    } catch (err) {
      setError(err.message || "Failed to delete purchase order");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    purchaseOrders,
    loading,
    error,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    fetchPurchaseOrders,
  };
} 