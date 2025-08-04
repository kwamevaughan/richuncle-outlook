import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import Image from "next/image";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { playBellBeep } from "@/utils/posSounds";
import SimpleModal from "./SimpleModal";
import TooltipIconButton from "@/components/TooltipIconButton";
import Select, { components } from 'react-select';

const PosProductList = ({ user, selectedProducts, setSelectedProducts, quantities, setQuantities, setProducts, reloadProducts, hasOpenSession = true, sessionCheckLoading = false, className = "", mode = "light" }) => {
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
  const [categoryPage, setCategoryPage] = useState(0);
  
  // Product pagination state
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [productsPerPage, setProductsPerPage] = useState(12); // Start with 20 products
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Prepare options for react-select
  const productOptions = React.useMemo(() => 
    products.map(product => ({
      value: product.id,
      label: product.name,
      product,
    })), [products]
  );

  // Custom option rendering for react-select
  const ProductOption = (props) => {
    const { product } = props.data;
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-3">
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{product.name}</div>
            <div className="text-xs text-gray-500">GHS {product.price}</div>
          </div>
          {user?.role !== "cashier" && (
            <div className="text-xs text-gray-400">Stock: {product.quantity}</div>
          )}
        </div>
      </components.Option>
    );
  };

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

  // Filter products by search and category
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      const searchLower = search.toLowerCase();
      const cat = categories.find((c) => c.id === product.category_id);
      
      // Filter by category first
      if (selectedCategory && selectedCategory !== "all") {
        if (product.category_id !== selectedCategory) {
          return false;
        }
      }
      
      // Then filter by search
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        (cat && cat.name?.toLowerCase().includes(searchLower))
      );
    });
  }, [products, search, selectedCategory, categories]);

  // Update displayed products when filtered products change
  useEffect(() => {
    setCurrentProductPage(1);
    const initialProducts = filteredProducts.slice(0, productsPerPage);
    setDisplayedProducts(initialProducts);
    setHasMoreProducts(filteredProducts.length > productsPerPage);
  }, [filteredProducts, productsPerPage]);

  // Load more products function
  const loadMoreProducts = () => {
    if (loadingMore || !hasMoreProducts) return;
    
    setLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const nextPage = currentProductPage + 1;
      const startIndex = (nextPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const newProducts = filteredProducts.slice(startIndex, endIndex);
      
      setDisplayedProducts(prev => [...prev, ...newProducts]);
      setCurrentProductPage(nextPage);
      setHasMoreProducts(endIndex < filteredProducts.length);
      setLoadingMore(false);
    }, 300);
  };

  // Category pagination logic - responsive
  const [categoriesPerPage, setCategoriesPerPage] = useState(4);
  
  // Update categories per page based on screen size
  useEffect(() => {
    const updateCategoriesPerPage = () => {
      setCategoriesPerPage(window.innerWidth < 640 ? 3 : 5);
    };
    
    updateCategoriesPerPage();
    window.addEventListener('resize', updateCategoriesPerPage);
    
    return () => window.removeEventListener('resize', updateCategoriesPerPage);
  }, []);
  
  const allCategories = React.useMemo(() => [
    { id: "all", name: "All", image_url: "https://ik.imagekit.io/164jkw2ne/CategoryImages/all_accessories.jpg?updatedAt=1751485982538" }, 
    ...categories
  ], [categories]);
  const totalPages = Math.ceil(allCategories.length / categoriesPerPage);
  const startIndex = categoryPage * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  const visibleCategories = allCategories.slice(startIndex, endIndex);

  const nextPage = () => {
    setCategoryPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  const prevPage = () => {
    setCategoryPage(prev => Math.max(prev - 1, 0));
  };

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
      toast.error(user?.role === "cashier" ? "Cannot exceed available stock." : `Cannot exceed available stock of ${product.quantity} units.`);
      return;
    }
    
    setQuantities((prev) => ({ ...prev, [productId]: val }));
  };

  const handleQuantityIncrement = (productId) => {
    const product = products.find(p => p.id === productId);
    const currentQty = quantities[productId] || 1;
    
    // Validate against stock
    if (product && currentQty >= product.quantity) {
      toast.error(user?.role === "cashier" ? "Cannot exceed available stock." : `Cannot exceed available stock of ${product.quantity} units.`);
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
    if (!hasOpenSession) {
      toast.error('You must open a cash register before making sales.');
      return;
    }
    const product = products.find(p => p.id === productId);
    const currentQty = quantities[productId] || 1;
    
    // Check if product is already selected
    if (selectedProducts.includes(productId)) {
      // Remove from selection (no beep sound)
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      return;
    }
    
    // Validate stock before adding
    if (product && currentQty > product.quantity) {
      toast.error(user?.role === "cashier" ? "Insufficient stock!" : `Insufficient stock! Only ${product.quantity} units available.`);
      return;
    }
    
    // Add to selection (no beep sound for adding products with stock)
    setSelectedProducts((prev) => [...prev, productId]);
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (quantity < 10) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'available', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className={className}>
      <div className={`flex rounded-lg overflow-hidden h-screen ${mode === "dark" ? "bg-gray-900" : "bg-white"}`}>
        {/* Tab Content: Products Grid */}
        <div className="w-full px-6 py-0 flex flex-col pt-28 sm:pt-2">
          <div className="flex justify-between items-center gap-4 mb-4">
            
          </div>
          <div className="flex items-center gap-2  mb-4">
            {/* Left Arrow */}
            <button
              type="button"
              onClick={prevPage}
              disabled={categoryPage === 0}
              className={` transition-colors focus:outline-none focus:ring-2  touch-manipulation ${
                categoryPage === 0
                  ? `${mode === "dark" ? "bg-gray-700 text-gray-500" : ""} cursor-not-allowed`
                  : `${mode === "dark" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-blue-50"} active:scale-95`
              }`}
            >
              <Icon icon="mdi:chevron-left" className="w-6 h-6" />
            </button>

            {/* Categories Container */}
            <div className=" flex gap-1 sm:gap-2 md:gap-4 flex-1 justify-center items-center overflow-x-auto scrollbar-hide">
              {catLoading && (
                <div className={`p-4 ${mode === "dark" ? "text-blue-400" : "text-blue-600"}`}>Loading...</div>
              )}
              {catError && <div className={`p-4 ${mode === "dark" ? "text-red-400" : "text-red-600"}`}>{catError}</div>}
              {!catLoading && !catError && visibleCategories.length === 0 && (
                <div className={`p-4 ${mode === "dark" ? "text-gray-500" : "text-gray-400"}`}>No categories</div>
              )}
              {visibleCategories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={` flex flex-col items-center justify-center text-center text-xs sm:text-sm font-semibold rounded-xl border transition-all duration-200 focus:outline-none  min-w-[60px] my-2 p-2 touch-manipulation active:scale-95 flex-shrink-0 ${
                    selectedCategory === cat.id
                      ? `${mode === "dark" ? "bg-blue-600 text-white border-blue-500" : "bg-blue-100 text-blue-700 border-blue-400"} scale-105`
                      : `${mode === "dark" ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600" : "bg-white text-gray-700 hover:bg-blue-100 border-transparent"}`
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
                      width={32}
                      height={32}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-cover rounded-full border"
                    />
                  )}
                  <span className="whitespace-normal break-words text-xs leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              type="button"
              onClick={nextPage}
              disabled={categoryPage >= totalPages - 1}
              className={` transition-colors focus:outline-none focus:ring-2  touch-manipulation ${
                categoryPage >= totalPages - 1
                  ? `${mode === "dark" ? "bg-gray-700 text-gray-500" : ""} cursor-not-allowed`
                  : `${mode === "dark" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-blue-50"} active:scale-95`
              }`}
            >
              <Icon icon="mdi:chevron-right" className="w-6 h-6" />
            </button>
          </div>

          {prodLoading && (
            <div className={`${mode === "dark" ? "text-blue-400" : "text-blue-600"}`}>Loading products...</div>
          )}
          {prodError && <div className={`${mode === "dark" ? "text-red-400" : "text-red-600"}`}>{prodError}</div>}
          {!prodLoading && !prodError && displayedProducts.length === 0 && (
            <div className={`${mode === "dark" ? "text-gray-500" : "text-gray-400"}`}>No products found.</div>
          )}
          
          {/* Products Grid with Load More */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-1">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`group relative border-2 rounded-xl p-3 flex flex-col items-center transition-all duration-200 cursor-pointer touch-manipulation m-0.5
                    ${
                      selectedProducts.includes(product.id)
                        ? `${mode === "dark" ? "border-green-400 shadow-green-900" : "border-green-500 shadow-green-100"} scale-105`
                        : `${mode === "dark" ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`
                    }
                    ${product.quantity > 0 ? 
                      `${mode === "dark" ? "group-hover:border-green-400 group-hover:shadow-green-900" : "group-hover:border-green-500 group-hover:shadow-green-100"}` 
                      : ""
                    }
                    hover:shadow-lg
                    active:scale-95
                  `}
                  style={{
                    boxShadow: selectedProducts.includes(product.id)
                      ? mode === "dark" ? "0 0 0 0 #4ade80" : "0 0 0 0 #22c55e"
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (product.quantity > 0) {
                      e.currentTarget.classList.add(
                        mode === "dark" ? "border-green-400" : "border-green-500",
                        mode === "dark" ? "shadow-green-900" : "shadow-green-100"
                      );
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedProducts.includes(product.id) && product.quantity > 0) {
                      e.currentTarget.classList.remove(
                        mode === "dark" ? "border-green-400" : "border-green-500",
                        mode === "dark" ? "shadow-green-900" : "shadow-green-100"
                      );
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!hasOpenSession) {
                      toast.error(
                        "You must open a cash register before making sales."
                      );
                      return;
                    }
                    if (product.quantity <= 0) {
                      toast.error("This product is out of stock!");
                      playBellBeep(); // Add beep sound for out of stock
                      return;
                    }
                    toggleProductSelect(product.id);
                  }}
                >
                  {(selectedProducts.includes(product.id) && product.quantity > 0) && (
                    <span
                      className={`absolute top-2 right-2 bg-green-500 rounded-full p-1 opacity-100 transition-all duration-500`}
                    >
                      <Icon icon="mdi:check" className="w-2 h-2 text-white" />
                    </span>
                  )}
                  {product.image_url ? (
                    <div className="w-full flex items-center justify-center mb-3 bg-gray-100 rounded-lg">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="object-cover rounded-lg w-20 h-20 transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <Icon
                        icon="carbon:no-image"
                        className="w-10 h-16 text-gray-400"
                      />
                    </div>
                  )}
                  {/* <div className={`text-sm mb-2 self-start ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    {(() => {
                      const cat = categories.find(
                        (c) => c.id === product.category_id
                      );
                      return cat ? cat.name : "";
                    })()}
                  </div> */}
                  <div className={`font-normal capitalize mb-2 self-start truncate max-w-full overflow-hidden text-xs ${mode === "dark" ? "text-white" : "text-black"}`}>
                    {product.name}
                  </div>

                  {/* Stock Status */}
                  {user?.role !== "cashier" && (
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
                  )}

                  <span className={`border-t w-full py-1 ${mode === "dark" ? "border-gray-600" : "border-gray-200"}`}></span>

                  <div className="flex flex-col gap-1 self-start w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-semibold ${mode === "dark" ? "text-blue-400" : "text-blue-700"}`}>
                        GHS {product.price}
                      </span>
                    </div>
                    {user?.role !== "cashier" && (
                      <div className={`flex items-center justify-between text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {product.cost_price && product.cost_price > 0 && (
                          <span>Cost: GHS {product.cost_price}</span>
                        )}
                        {product.tax_percentage && product.tax_percentage > 0 && (
                          <span className="text-orange-600">
                            Tax: {product.tax_percentage}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMoreProducts && !prodLoading && (
              <div className="flex justify-center py-6">
                <button
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  className={`px-4 py-2 rounded-xl font-semibold text-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation ${
                    loadingMore
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:chevron-down" className="w-5 h-5" />
                      Load More Products
                    </div>
                  )}
                </button>
              </div>
            )}
            
            {/* Products Count Info */}
            {!prodLoading && displayedProducts.length > 0 && (
              <div className={`text-center py-2 text-sm ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                Showing {displayedProducts.length} of {filteredProducts.length} products
              </div>
            )}
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
              className="w-full border rounded-lg px-4 py-3 text-lg"
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
                  if (!hasOpenSession) {
                    toast.error('You must open a cash register before making sales.');
                    return;
                  }
                  if (barcodeQty > barcodeProduct.quantity) {
                    toast.error(
                      user?.role === "cashier" 
                        ? "Cannot add items. Insufficient stock." 
                        : `Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`
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
              {user?.role !== "cashier" && (
                <div className="mb-2">Stock: {barcodeProduct.quantity}</div>
              )}
              <div className="mb-2 flex items-center gap-2">
                <span>Quantity:</span>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-lg text-lg font-bold touch-manipulation active:scale-95"
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
                  className="w-20 border rounded-lg px-3 py-2 text-center text-sm"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-lg text-lg font-bold touch-manipulation active:scale-95"
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
                className="w-full bg-green-600 text-white rounded-lg py-4 font-semibold mt-4 text-lg touch-manipulation active:scale-95"
                onClick={() => {
                  if (!hasOpenSession) {
                    toast.error('You must open a cash register before making sales.');
                    return;
                  }
                  if (barcodeQty > barcodeProduct.quantity) {
                    toast.error(
                      user?.role === "cashier" 
                        ? "Cannot add items. Insufficient stock." 
                        : `Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`
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