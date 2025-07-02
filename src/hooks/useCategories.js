import { useState, useEffect } from "react";
import { supabaseClient } from "../lib/supabase";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      supabaseClient
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabaseClient.from("subcategories").select("*"),
      supabaseClient.from("products").select("category_id")
    ])
      .then(([catRes, subRes, prodRes]) => {
        if (catRes.error) throw catRes.error;
        if (subRes.error) throw subRes.error;
        if (prodRes.error) throw prodRes.error;
        // Count products per category in JS
        const productCounts = {};
        (prodRes.data || []).forEach((row) => {
          if (row.category_id) {
            productCounts[row.category_id] = (productCounts[row.category_id] || 0) + 1;
          }
        });
        // Add product_count to each category
        const categoriesWithCount = (catRes.data || []).map((cat) => ({
          ...cat,
          product_count: productCounts[cat.id] || 0,
        }));
        setCategories(categoriesWithCount);
        setSubCategories(subRes.data || []);
      })
      .catch((err) => setError(err.message || "Failed to load data"))
      .finally(() => setLoading(false));
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