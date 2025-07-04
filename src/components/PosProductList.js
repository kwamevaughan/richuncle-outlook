import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { supabaseClient } from "@/lib/supabase";
import Image from "next/image";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

const PosProductList = ({ user, selectedProducts, setSelectedProducts, quantities, setQuantities, setProducts }) => {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, _setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState(null);
  const [search, setSearch] = useState("");
  const [reloadFlag, setReloadFlag] = useState(0);

  // Fetch products when selectedCategory changes or reloadFlag changes
  useEffect(() => {
    if (!selectedCategory) return;
    setProdLoading(true);
    setProdError(null);
    let query = supabaseClient.from("products").select("*");
    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }
    query
      .then(({ data, error }) => {
        if (error) setProdError(error.message || "Failed to load products");
        _setProducts(data || []);
        setProducts(data || []);
      })
      .catch((err) => setProdError(err.message || "Failed to load products"))
      .finally(() => setProdLoading(false));
  }, [selectedCategory, reloadFlag]);

  // Select 'All' as default if no category selected
  useEffect(() => {
    if (!catLoading && categories.length > 0 && !selectedCategory) {
      setSelectedCategory("all");
    }
  }, [catLoading, categories, selectedCategory]);

  // Filter products by search
  const filteredProducts = products.filter((product) => {
    const searchLower = search.toLowerCase();
    const cat = categories.find((c) => c.id === product.category_id);
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower) ||
      (cat && cat.name?.toLowerCase().includes(searchLower))
    );
  });

  // Dismiss toast when products finish loading
  useEffect(() => {
    if (!prodLoading) {
      toast.dismiss("reload-products");
      if (reloadFlag > 0) {
        toast.success("Products refreshed!", { id: "reload-products-success" });
      }
    }
  }, [prodLoading]);

  const handleQuantityChange = (productId, value) => {
    const product = products.find(p => p.id === productId);
    const val = Math.max(1, Number(value) || 1);
    
    // Validate against stock
    if (product && val > product.quantity) {
      toast.error(`Cannot exceed available stock of ${product.quantity} units.`);
      return;
    }
    
    setQuantities((prev) => ({ ...prev, [productId]: val }));
  };

  const handleQuantityIncrement = (productId) => {
    const product = products.find(p => p.id === productId);
    const currentQty = quantities[productId] || 1;
    
    // Validate against stock
    if (product && currentQty >= product.quantity) {
      toast.error(`Cannot exceed available stock of ${product.quantity} units.`);
      return;
    }
    
    setQuantities((prev) => ({ ...prev, [productId]: currentQty + 1 }));
  };

  const handleQuantityDecrement = (productId) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, (prev[productId] || 1) - 1) }));
  };

  const toggleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    const currentQty = quantities[productId] || 1;
    
    // Check if product is already selected
    if (selectedProducts.includes(productId)) {
      // Remove from selection
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      return;
    }
    
    // Validate stock before adding
    if (product && currentQty > product.quantity) {
      toast.error(`Insufficient stock! Only ${product.quantity} units available.`);
      return;
    }
    
    // Add to selection
    setSelectedProducts((prev) =>
      [...prev, productId]
    );
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (quantity < 10) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'available', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className="flex-1">
      <div className="flex rounded-lg overflow-hidden h-screen">
        {/* Vertical Tabs: Categories */}
        <div className="flex flex-col border-r w-30 bg-gray-50 py-2 gap-2 min-h-0 overflow-auto">
          {/* All tab */}
          <button
            key="all"
            className={`flex flex-col items-center justify-center px-2 py-4 text-center text-sm font-medium rounded-lg border transition-colors duration-150 focus:outline-none bg-white  hover:bg-blue-100 gap-2 ${
              selectedCategory === "all"
                ? "bg-blue-100 text-blue-700 border-blue-400"
                : "text-gray-700 border-transparent"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            <Image
              src="https://ik.imagekit.io/164jkw2ne/CategoryImages/all_accessories.jpg?updatedAt=1751485982538"
              alt="All"
              width={40}
              height={40}
              className="w-8 h-8 object-cover rounded-full mb-1 border"
            />
            <span className="whitespace-normal break-words font-semibold">
              All
            </span>
          </button>
          {/* Category tabs */}
          {catLoading && <div className="p-4 text-blue-600">Loading...</div>}
          {catError && <div className="p-4 text-red-600">{catError}</div>}
          {!catLoading && !catError && categories.length === 0 && (
            <div className="p-4 text-gray-400">No categories</div>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`flex flex-col items-center justify-center px-2 py-4 text-center text-sm font-semibold rounded-lg border transition-colors duration-150 focus:outline-none hover:bg-blue-100 bg-white gap-2 ${
                selectedCategory === cat.id
                  ? "bg-blue-100 text-blue-700 border-blue-400"
                  : "text-gray-700 border-transparent"
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.image_url && (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  width={40}
                  height={40}
                  className="w-8 h-8 object-cover rounded-full mb-1 border"
                />
              )}
              <span className="whitespace-normal break-words">{cat.name}</span>
            </button>
          ))}
        </div>
        {/* Tab Content: Products Grid */}
        <div className="flex-1 px-6 py-0 flex flex-col">
          <div className="flex justify-between items-center gap-4 mb-4">
            <h1 className="text-lg font-bold flex items-center gap-2">
              Welcome,
              <span>{user.name}</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon icon="material-symbols:search-rounded" className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="border rounded pl-10 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  toast.loading("Refreshing products...", { id: "reload-products" });
                  setReloadFlag(f => f + 1);
                }}
                className="ml-2 p-2 rounded border bg-white hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="Reload products"
              >
                <Icon icon="material-symbols:refresh" className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>

          {prodLoading && (
            <div className="text-blue-600">Loading products...</div>
          )}
          {prodError && <div className="text-red-600">{prodError}</div>}
          {!prodLoading && !prodError && filteredProducts.length === 0 && (
            <div className="text-gray-400">No products found.</div>
          )}
          <div className="overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`group relative border-2 rounded-lg p-3 flex flex-col items-center bg-gray-50 hover:shadow-lg transition cursor-pointer
                  ${selectedProducts.includes(product.id) ? 'border-green-500 shadow-green-100' : 'border-gray-200'}
                  group-hover:border-green-500 group-hover:shadow-green-100
                `}
                style={{ boxShadow: selectedProducts.includes(product.id) ? '0 0 0 0 #22c55e' : undefined }}
                onMouseEnter={e => e.currentTarget.classList.add('border-green-500', 'shadow-green-100')}
                onMouseLeave={e => !selectedProducts.includes(product.id) && e.currentTarget.classList.remove('border-green-500', 'shadow-green-100')}
                onClick={() => toggleProductSelect(product.id)}
              >
                {(selectedProducts.includes(product.id) || true /* always show on hover */) && (
                  <span className={`absolute top-2 right-2 bg-green-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-500 ${selectedProducts.includes(product.id) ? 'opacity-100' : ''}`}>
                    <Icon icon="mdi:check" className="w-2 h-2 text-white" />
                  </span>
                )}
                {product.image_url && (
                  <div className="w-full flex items-center justify-center mb-2 bg-gray-100 rounded p-2 ">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={112}
                      height={112}
                      className="object-cover rounded w-28 h-28 transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="text-xs text-gray-500 mb-1 self-start">
                  {(() => {
                    const cat = categories.find(
                      (c) => c.id === product.category_id
                    );
                    return cat ? cat.name : "";
                  })()}
                </div>
                <div className="font-semibold mb-1 self-start truncate max-w-[120px] overflow-hidden">{product.name}</div>

                {/* Stock Status */}
                <div className="self-start mb-1">
                  {(() => {
                    const stockStatus = getStockStatus(product.quantity);
                    return (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status === 'out' ? 'Out of Stock' : 
                         stockStatus.status === 'low' ? `Low Stock (${product.quantity})` : 
                         `In Stock (${product.quantity})`}
                      </span>
                    );
                  })()}
                </div>

                <span className="border-t w-full py-1"></span>

                <div className="flex items-center gap-1 self-start mt-1 whitespace-nowrap">
                  <span className="text-sm font-bold text-blue-700  ">GHS {product.price}</span>
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosProductList; 