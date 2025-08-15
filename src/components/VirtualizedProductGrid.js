import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

const ITEM_WIDTH = 280;
const ITEM_HEIGHT = 320;
const GUTTER_SIZE = 16;

const VirtualizedProductGrid = ({ 
  products, 
  onProductSelect, 
  selectedProducts = [],
  containerWidth = 1200,
  containerHeight = 600,
  mode = "light"
}) => {
  // Calculate grid dimensions
  const columnCount = Math.floor((containerWidth + GUTTER_SIZE) / (ITEM_WIDTH + GUTTER_SIZE));
  const rowCount = Math.ceil(products.length / columnCount);

  // Memoized product grid data
  const gridData = useMemo(() => ({
    products,
    columnCount,
    onProductSelect,
    selectedProducts,
    mode
  }), [products, columnCount, onProductSelect, selectedProducts, mode]);

  // Optimized cell renderer
  const Cell = useCallback(({ columnIndex, rowIndex, style, data }) => {
    const { products, columnCount, onProductSelect, selectedProducts, mode } = data;
    const index = rowIndex * columnCount + columnIndex;
    const product = products[index];

    if (!product) return null;

    const isSelected = selectedProducts.includes(product.id);

    return (
      <div
        style={{
          ...style,
          left: style.left + GUTTER_SIZE / 2,
          top: style.top + GUTTER_SIZE / 2,
          width: style.width - GUTTER_SIZE,
          height: style.height - GUTTER_SIZE,
        }}
      >
        <div
          className={`
            border-2 rounded-xl p-3 flex flex-col items-center cursor-pointer transition-all duration-200
            ${isSelected 
              ? mode === "dark" 
                ? "border-green-400 bg-gray-800 scale-105" 
                : "border-green-500 bg-white scale-105"
              : mode === "dark"
                ? "border-gray-600 bg-gray-800 hover:border-green-400"
                : "border-gray-200 bg-white hover:border-green-500"
            }
            hover:shadow-lg active:scale-95
          `}
          onClick={() => onProductSelect(product.id)}
        >
          {/* Product Image */}
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg mb-3"
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}

          {/* Product Name */}
          <div className={`font-medium text-sm mb-2 text-center line-clamp-2 ${
            mode === "dark" ? "text-white" : "text-black"
          }`}>
            {product.name}
          </div>

          {/* Stock Status */}
          {product.quantity <= 0 ? (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 mb-2">
              Out of Stock
            </span>
          ) : product.quantity < 10 ? (
            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 mb-2">
              Low Stock ({product.quantity})
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600 mb-2">
              In Stock ({product.quantity})
            </span>
          )}

          {/* Price */}
          <div className={`text-lg font-bold ${
            mode === "dark" ? "text-blue-400" : "text-blue-700"
          }`}>
            GHS {product.price}
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  if (!products.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">No products found</span>
      </div>
    );
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={ITEM_WIDTH + GUTTER_SIZE}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={ITEM_HEIGHT + GUTTER_SIZE}
      width={containerWidth}
      itemData={gridData}
    >
      {Cell}
    </Grid>
  );
};

export default React.memo(VirtualizedProductGrid);