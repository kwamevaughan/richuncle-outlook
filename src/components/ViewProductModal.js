import SimpleModal from "./SimpleModal";
import Image from "next/image";
import { Icon } from "@iconify/react";

export default function ViewProductModal({ product, isOpen, onClose, mode }) {
  if (!product) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  const getStatusBadge = (isActive) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const productDetails = [
    { label: "SKU", value: product.sku, icon: "mdi:tag-outline" },
    {
      label: "Category",
      value: product.category_name,
      icon: "mdi:folder-outline",
    },
    { label: "Brand", value: product.brand_name, icon: "mdi:label-outline" },
    { label: "Unit", value: product.unit_name, icon: "mdi:ruler" },
    { label: "Quantity", value: product.quantity, icon: "mdi:package-variant" },
    {
      label: "Selling Type",
      value: product.selling_type,
      icon: "mdi:briefcase-outline",
    },
  ];

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name || "Product Details"}
      mode={mode}
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {product.image_url ? (
                <div className="relative group">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    className="w-48 h-48 object-cover rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-105"
                    width={192}
                    height={192}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl flex items-center justify-center shadow-inner">
                  <div className="text-slate-400 dark:text-slate-500 text-center">
                    <Icon
                      icon="mdi:image-off-outline"
                      className="text-4xl mb-2 mx-auto"
                    />
                    <div className="text-sm font-medium">No Image</div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info Header */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(product.is_active)}
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      SKU: {product.sku}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                >
                  <Icon icon="mdi:printer" className="text-lg" />
                  Print
                </button>
              </div>

              {/* Price and Barcode Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Section */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Price
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Barcode Section */}
                {product.barcode && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Barcode
                    </div>
                    <div className="flex flex-col items-center">
                      <img
                        src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
                          product.barcode
                        )}&code=Code128&translate-esc=true`}
                        alt={`Barcode: ${product.barcode}`}
                        className="h-12 w-auto mb-2"
                      />
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {product.barcode}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:information-outline" className="text-xl" />
            Product Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productDetails.map((detail, index) => (
              <div key={index} className="group">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <Icon
                    icon={detail.icon}
                    className="text-lg flex-shrink-0 mt-0.5 text-slate-500 dark:text-slate-400"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {detail.label}
                    </div>
                    <div className="text-slate-900 dark:text-white font-medium break-words">
                      {detail.value || "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Actions or Info */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live data
          </div>
        </div>
      </div>
    </SimpleModal>
  );
}
