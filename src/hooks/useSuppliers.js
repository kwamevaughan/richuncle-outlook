import { useState, useEffect } from "react";

export default function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/suppliers");
      const result = await response.json();
      if (result.success) {
        setSuppliers(result.data || []);
      } else {
        throw new Error(result.error || "Failed to fetch suppliers");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Add supplier
  const addSupplier = async (supplier) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplier),
      });
      const result = await response.json();
      if (result.success) {
        setSuppliers((prev) => [result.data, ...prev]);
        return result.data;
      } else {
        throw new Error(result.error || "Failed to add supplier");
      }
    } catch (err) {
      setError(err.message || "Failed to add supplier");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update supplier
  const updateSupplier = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        setSuppliers((prev) => prev.map((s) => (s.id === id ? result.data : s)));
        return result.data;
      } else {
        throw new Error(result.error || "Failed to update supplier");
      }
    } catch (err) {
      setError(err.message || "Failed to update supplier");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete supplier
  const deleteSupplier = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        return true;
      } else {
        throw new Error(result.error || "Failed to delete supplier");
      }
    } catch (err) {
      setError(err.message || "Failed to delete supplier");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  };
} 