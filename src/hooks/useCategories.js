import { useState, useEffect } from "react";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        // Fetch categories from API
        const categoriesResponse = await fetch('/api/categories');
        const categoriesResult = await categoriesResponse.json();
        
        if (!categoriesResponse.ok) {
          throw new Error(categoriesResult.error || 'Failed to load categories');
        }
        
        const categoriesData = categoriesResult.data || [];
        
        // For now, set subcategories as empty array since we don't have that API yet
        setCategories(categoriesData);
        setSubCategories([]);
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return {
    categories,
    setCategories,
    subCategories,
    setSubCategories,
    loading,
    error,
  };
} 