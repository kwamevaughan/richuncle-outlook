import { useState, useCallback } from "react";

export default function useSalesReturns() {
  const [salesReturns, setSalesReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSalesReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sales-returns");
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setSalesReturns(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch sales returns");
    } finally {
      setLoading(false);
    }
  }, []);

  const addSalesReturn = async (ret) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sales-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ret),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      setSalesReturns((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message || "Failed to add sales return");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSalesReturn = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sales-returns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const { data, error } = await response.json();
      if (error) throw new Error(error);
      await fetchSalesReturns();
      return data;
    } catch (err) {
      setError(err.message || "Failed to update sales return");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSalesReturn = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sales-returns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const { error } = await response.json();
      if (error) throw new Error(error);
      await fetchSalesReturns();
    } catch (err) {
      setError(err.message || "Failed to delete sales return");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    salesReturns,
    loading,
    error,
    addSalesReturn,
    updateSalesReturn,
    deleteSalesReturn,
    fetchSalesReturns,
  };
} 