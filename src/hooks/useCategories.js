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
    ])
      .then(([catRes, subRes]) => {
        if (catRes.error) throw catRes.error;
        if (subRes.error) throw subRes.error;
        setCategories(catRes.data || []);
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