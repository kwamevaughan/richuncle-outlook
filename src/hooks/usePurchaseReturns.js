import { useState, useCallback } from "react";

export default function usePurchaseReturns() {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPurchaseReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-returns");
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setPurchaseReturns(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch purchase returns");
    } finally {
      setLoading(false);
    }
  }, []);

  const addPurchaseReturn = async (ret) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ret),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setPurchaseReturns((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message || "Failed to add purchase return");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseReturn = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-returns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      await fetchPurchaseReturns();
      return data;
    } catch (err) {
      setError(err.message || "Failed to update purchase return");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePurchaseReturn = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase-returns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const { error } = await response.json();
      if (error) throw new Error(error);
      await fetchPurchaseReturns();
    } catch (err) {
      setError(err.message || "Failed to delete purchase return");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    purchaseReturns,
    loading,
    error,
    addPurchaseReturn,
    updatePurchaseReturn,
    deletePurchaseReturn,
    fetchPurchaseReturns,
  };
} 