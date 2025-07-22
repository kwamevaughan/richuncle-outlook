import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import Image from "next/image";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { playBellBeep } from "@/utils/posSounds";
import SimpleModal from "./SimpleModal";
import TooltipIconButton from "@/components/TooltipIconButton";

const PosProductList = ({ user, selectedProducts, setSelectedProducts, quantities, setQuantities, setProducts, reloadProducts, hasOpenSession = true, sessionCheckLoading = false }) => {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, _setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState(null);
  const [search, setSearch] = useState("");
  const [reloadFlag, setReloadFlag] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeQty, setBarcodeQty] = useState(1);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);


  // Fetch products when selectedCategory changes or reloadFlag changes
  useEffect(() => {
    if (!selectedCategory) return;
    setProdLoading(true);
    setProdError(null);
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        const { data, error } = await response.json();
        if (error) setProdError(error.message || "Failed to load products");
        _setProducts(data || []);
        setProducts(data || []);
      } finally {
        setProdLoading(false);
      }
    }
    fetchProducts();
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

  // Add this useEffect to reload products when reloadProducts changes
  useEffect(() => {
    if (reloadProducts !== undefined) {
      setReloadFlag(f => f + 1);
    }
  }, [reloadProducts]);

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
    if (sessionCheckLoading) {
      toast.error('Checking register status, please wait...');
      return;
    }
    if (user?.role === 'cashier' && !hasOpenSession) {
      toast.error('You must open a cash register before making sales.');
      return;
    }
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
    
    // Add to selection and play beep sound
    setSelectedProducts((prev) => [...prev, productId]);
    playBellBeep();
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
            type="button"
            key="all"
            className={`flex flex-col items-center justify-center px-2 py-4 text-center text-sm font-medium rounded-lg border transition-colors duration-150 focus:outline-none bg-white  hover:bg-blue-100 gap-2 ${
              selectedCategory === "all"
                ? "bg-blue-100 text-blue-700 border-blue-400"
                : "text-gray-700 border-transparent"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedCategory("all");
            }}
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
              type="button"
              key={cat.id}
              className={`flex flex-col items-center justify-center px-2 py-4 text-center text-sm font-semibold rounded-lg border transition-colors duration-150 focus:outline-none hover:bg-blue-100 bg-white gap-2 ${
                selectedCategory === cat.id
                  ? "bg-blue-100 text-blue-700 border-blue-400"
                  : "text-gray-700 border-transparent"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedCategory(cat.id);
              }}
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
              <TooltipIconButton
                label="Open Barcode Scanner"
                mode="light"
                className="ml-2 p-2 rounded-2xl border bg-white hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setShowBarcodeModal(true)}
              >
                <Icon icon="mdi:fullscreen" className="w-5 h-5" />
              </TooltipIconButton>
              <div
                className="relative flex-1"
                style={{ width: "100%", maxWidth: "900px", minWidth: "400px" }}
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon
                    icon="material-symbols:search-rounded"
                    className="w-5 h-5"
                  />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Search products..."
                  className="border rounded-2xl pl-10 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <TooltipIconButton
                label="Refresh Product List"
                mode="light"
                className="ml-2 p-2 rounded-2xl border bg-white hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.loading("Refreshing products...", {
                    id: "reload-products",
                  });
                  setReloadFlag((f) => f + 1);
                }}
              >
                <Icon
                  icon="material-symbols:refresh"
                  className="w-5 h-5 text-blue-800"
                />
              </TooltipIconButton>
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
                  ${
                    selectedProducts.includes(product.id)
                      ? "border-green-500 shadow-green-100"
                      : "border-gray-200"
                  }
                  group-hover:border-green-500 group-hover:shadow-green-100
                `}
                style={{
                  boxShadow: selectedProducts.includes(product.id)
                    ? "0 0 0 0 #22c55e"
                    : undefined,
                }}
                onMouseEnter={(e) =>
                  e.currentTarget.classList.add(
                    "border-green-500",
                    "shadow-green-100"
                  )
                }
                onMouseLeave={(e) =>
                  !selectedProducts.includes(product.id) &&
                  e.currentTarget.classList.remove(
                    "border-green-500",
                    "shadow-green-100"
                  )
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (user?.role === "cashier" && !hasOpenSession) {
                    toast.error(
                      "You must open a cash register before making sales."
                    );
                    return;
                  }
                  toggleProductSelect(product.id);
                }}
              >
                {(selectedProducts.includes(product.id) ||
                  true) /* always show on hover */ && (
                  <span
                    className={`absolute top-2 right-2 bg-green-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                      selectedProducts.includes(product.id) ? "opacity-100" : ""
                    }`}
                  >
                    <Icon icon="mdi:check" className="w-2 h-2 text-white" />
                  </span>
                )}
                {product.image_url ? (
                  <div className="w-full flex items-center justify-center mb-2 bg-gray-100 rounded p-2 ">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={112}
                      height={112}
                      className="object-cover rounded w-28 h-28 transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center mb-2 bg-gray-100 rounded p-2 ">
                    <Icon
                      icon="mdi:image-off-outline"
                      className="rounded border w-28 h-28 text-gray-400 bg-gray-100 object-cover"
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
                <div className="font-semibold mb-1 self-start truncate max-w-[120px] overflow-hidden">
                  {product.name}
                </div>

                {/* Stock Status */}
                <div className="self-start mb-1">
                  {(() => {
                    const stockStatus = getStockStatus(product.quantity);
                    return (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${stockStatus.bg} ${stockStatus.color}`}
                      >
                        {stockStatus.status === "out"
                          ? "Out of Stock"
                          : stockStatus.status === "low"
                          ? `Low Stock (${product.quantity})`
                          : `In Stock (${product.quantity})`}
                      </span>
                    );
                  })()}
                </div>

                <span className="border-t w-full py-1"></span>

                <div className="flex flex-col gap-1 self-start mt-1 w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold text-blue-700">
                      GHS {product.price}
                    </span>
                    {user?.role !== "cashier" && (
                      <span className="text-xs text-gray-500">
                        Cost: GHS {product.cost_price || 0}
                      </span>
                    )}
                  </div>
                  {product.cost_price &&
                    product.cost_price > 0 &&
                    user?.role !== "cashier" && (
                      <div className="text-xs text-green-600 font-medium">
                        Profit: GHS{" "}
                        {(
                          (product.price - product.cost_price) *
                          (quantities[product.id] || 1)
                        ).toFixed(2)}
                      </div>
                    )}
                  {product.tax_percentage &&
                    product.tax_percentage > 0 &&
                    user?.role !== "cashier" && (
                      <div className="text-xs text-orange-600 font-medium">
                        Tax: {product.tax_percentage}% (
                        {product.tax_type === "inclusive"
                          ? "Included"
                          : "Added"}
                        )
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showBarcodeModal && (
        <SimpleModal
          isOpen={true}
          onClose={() => {
            setShowBarcodeModal(false);
            setBarcodeInput("");
            setBarcodeProduct(null);
            setBarcodeError("");
            setBarcodeQty(1);
          }}
          title="Add Product by Barcode"
          mode="light"
          width="max-w-md"
        >
          <div className="space-y-4">
            <label className="block font-semibold">Enter Barcode</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={barcodeInput}
              onChange={(e) => {
                const value = e.target.value;
                setBarcodeInput(value);
                setBarcodeError("");
                if (!value.trim()) {
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  return;
                }
                const found = products.find((p) => p.barcode === value.trim());
                if (!found) {
                  setBarcodeProduct(null);
                  setBarcodeError("No product found with this barcode.");
                } else {
                  setBarcodeProduct(found);
                  setBarcodeQty(quantities[found.id] || 1);
                  setBarcodeError("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && barcodeProduct) {
                  // Add product immediately on Enter
                  if (barcodeQty > barcodeProduct.quantity) {
                    toast.error(
                      `Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`
                    );
                    return;
                  }
                  if (!selectedProducts.includes(barcodeProduct.id)) {
                    setSelectedProducts([
                      ...selectedProducts,
                      barcodeProduct.id,
                    ]);
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: barcodeQty,
                    }));
                  } else {
                    const newQty =
                      (quantities[barcodeProduct.id] || 1) + barcodeQty;
                    if (newQty > barcodeProduct.quantity) {
                      toast.error(
                        `Cannot add ${barcodeQty} more units. Total would exceed available stock of ${barcodeProduct.quantity} units.`
                      );
                      return;
                    }
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: newQty,
                    }));
                  }
                  playBellBeep();
                  toast.success(`Added ${barcodeProduct.name} to order list!`);
                  setShowBarcodeModal(false);
                  setBarcodeInput("");
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  setBarcodeQty(1);
                }
              }}
              placeholder="Scan or enter barcode"
              autoFocus
            />
            {barcodeError && (
              <div className="text-red-500 text-sm">{barcodeError}</div>
            )}
          </div>
          {barcodeProduct && (
            <div className="mt-6 p-4 border rounded bg-gray-50">
              <div className="font-bold mb-2">{barcodeProduct.name}</div>
              <div className="mb-2">
                Price: GHS {barcodeProduct.price?.toLocaleString()}
              </div>
              <div className="mb-2">Stock: {barcodeProduct.quantity}</div>
              <div className="mb-2 flex items-center gap-2">
                <span>Quantity:</span>
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() => setBarcodeQty((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={barcodeProduct.quantity}
                  value={barcodeQty}
                  onChange={(e) => setBarcodeQty(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1"
                />
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() =>
                    setBarcodeQty((q) =>
                      Math.min(barcodeProduct.quantity, q + 1)
                    )
                  }
                >
                  +
                </button>
              </div>
              <button
                className="w-full bg-green-600 text-white rounded py-2 font-semibold mt-2"
                onClick={() => {
                  if (barcodeQty > barcodeProduct.quantity) {
                    toast.error(
                      `Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`
                    );
                    return;
                  }

                  if (!selectedProducts.includes(barcodeProduct.id)) {
                    setSelectedProducts([
                      ...selectedProducts,
                      barcodeProduct.id,
                    ]);
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: barcodeQty,
                    }));
                  } else {
                    const newQty =
                      (quantities[barcodeProduct.id] || 1) + barcodeQty;
                    if (newQty > barcodeProduct.quantity) {
                      toast.error(
                        `Cannot add ${barcodeQty} more units. Total would exceed available stock of ${barcodeProduct.quantity} units.`
                      );
                      return;
                    }
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: newQty,
                    }));
                  }
                  // Play beep sound and show success message
                  playBellBeep();
                  setShowBarcodeModal(false);
                  setBarcodeInput("");
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  setBarcodeQty(1);
                  toast.success("Product added to order list!");
                }}
              >
                Add to Order List
              </button>
            </div>
          )}
        </SimpleModal>
      )}
    </div>
  );
};

export default PosProductList;