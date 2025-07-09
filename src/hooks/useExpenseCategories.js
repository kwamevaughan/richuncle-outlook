import { useState, useEffect } from "react";

export function useExpenseCategories() {
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        // Fetch expense categories from API
        const response = await fetch('/api/expense-categories');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to load expense categories');
        }
        
        const data = result.data || [];
        setExpenseCategories(data);
      } catch (err) {
        setError(err.message || "Failed to load expense categories");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return {
    expenseCategories,
    setExpenseCategories,
    loading,
    error,
  };
} 