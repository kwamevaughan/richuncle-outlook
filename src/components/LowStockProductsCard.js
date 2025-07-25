import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import Image from "next/image";

export default function LowStockProductsCard({ selectedStore }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to fetch products");
        // Low stock: quantity <= 20 (adjust as needed)
        const lowStock = (json.data || []).filter(p => parseInt(p.quantity) > 0 && parseInt(p.quantity) <= 20 && (!selectedStore || String(p.store_id) === String(selectedStore)));
        setProducts(lowStock);
      } catch (err) {
        setError(err.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 ">
          <span className="bg-red-50 p-2 rounded-full">
            <Icon
              icon="mdi:alert-circle-outline"
              className="text-red-500 text-lg"
            />
          </span>
          <span className="font-bold text-lg">Low Stock Products</span>
        </div>
        <button
          className="text-blue-900 text-xs font-semibold underline hover:text-blue-900"
          onClick={() => router.push("/manage-stock")}
        >
          View All
        </button>
      </div>
      <hr className="my-2 border-gray-100" />
      <div>
        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            No low stock products.
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 py-3 border-b last:border-b-0"
            >
              <Image
                src={product.image_url || "/placeholder.png"}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover border"
                width={56}
                height={56}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-md text-gray-900 truncate">
                  {product.name}
                </div>
                <div className="text-gray-500 text-xs">
                  ID : #{product.sku || product.id}
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[60px]">
                <span className="text-xs text-gray-500 font-medium mb-1">
                  In Stock
                </span>
                <span className="text-orange-500 font-bold text-sm tabular-nums">
                  {parseInt(product.quantity).toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 