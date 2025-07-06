import { useState, useCallback } from "react";

export default function usePurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases");
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setPurchases(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  const addPurchase = async (purchase) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchase),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setPurchases((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message || "Failed to add purchase");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePurchase = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      await fetchPurchases();
      return data;
    } catch (err) {
      setError(err.message || "Failed to update purchase");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePurchase = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const { error } = await response.json();
      if (error) throw new Error(error);
      await fetchPurchases();
    } catch (err) {
      setError(err.message || "Failed to delete purchase");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    purchases,
    loading,
    error,
    addPurchase,
    updatePurchase,
    deletePurchase,
    fetchPurchases,
  };
} 