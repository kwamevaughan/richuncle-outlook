import SimpleModal from "./SimpleModal";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Barcode from 'react-barcode';
import { useRef, useState, useEffect } from "react";

export default function ViewProductModal({ product, isOpen, onClose, mode }) {
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch variant attributes when modal opens
  useEffect(() => {
    if (isOpen && product?.variant_attributes) {
      setLoading(true);
      fetch('/api/variant-attributes')
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            setVariantAttributes(result.data || []);
          }
        })
        .catch(err => {
          console.error("Failed to fetch variant attributes:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, product?.variant_attributes]);

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
    { label: "Cost Price", value: formatPrice(product.cost_price || 0), icon: "mdi:currency-usd" },
    { 
      label: "Tax Configuration", 
      value: `${product.tax_type === 'inclusive' ? 'Inclusive' : 'Exclusive'} (${product.tax_percentage || 0}%)`, 
      icon: "mdi:receipt-text" 
    },
    {
      label: "Selling Type",
      value: (() => {
        let val = product.selling_type;
        // If it's an array with a single string that looks like a JSON array, parse it
        if (Array.isArray(val) && val.length === 1 && typeof val[0] === "string" && val[0].startsWith("[")) {
          try {
            val = JSON.parse(val[0]);
          } catch {}
        }
        // If it's a string that looks like a JSON array, parse it
        if (typeof val === "string" && val.startsWith("[")) {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        // If it's now an array, join it
        if (Array.isArray(val)) {
          return val.join(", ");
        }
        // Otherwise, just return as string
        return val || "—";
      })(),
      icon: "mdi:briefcase-outline",
    },
  ];

  const printRef = useRef();

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=900,height=650');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Product Details</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 24px; background: #fff; }
            .print-barcode { margin: 16px 0; }
            .print-title { font-size: 2rem; font-weight: bold; margin-bottom: 12px; }
            .print-section { margin-bottom: 18px; }
            .print-label { font-weight: 500; color: #555; }
            .print-value { font-weight: 600; color: #222; }
            .barcode svg { width: 180px !important; height: 48px !important; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name || "Product Details"}
      mode={mode}
      width="max-w-5xl"
    >
      <div className="space-y-6" ref={printRef}>
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
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                >
                  <Icon icon="mdi:printer" className="text-lg" />
                  Print
                </button>
              </div>

              {/* Price and Barcode Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selling Price Section */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Selling Price
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Cost Price Section */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cost Price
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(product.cost_price || 0)}
                  </div>
                </div>

                {/* Barcode Section */}
                {product.barcode && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Barcode
                    </div>
                    <div className="flex flex-col items-center">
                      <Barcode value={product.barcode} height={48} width={2} displayValue={false} />
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

        {/* Variant Attributes Section */}
        {product.variant_attributes && Object.keys(product.variant_attributes).length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="text-xl" />
              Variant Attributes
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Icon icon="mdi:loading" className="animate-spin w-6 h-6 text-blue-600" />
                <span className="ml-2 text-gray-600">Loading variant attributes...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.variant_attributes).map(([attrId, value]) => {
                    const attribute = variantAttributes.find(attr => attr.id === attrId);
                    return (
                      <div key={attrId} className="group">
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <Icon
                            icon="mdi:tag-outline"
                            className="text-lg flex-shrink-0 mt-0.5 text-slate-500 dark:text-slate-400"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                              {attribute ? attribute.name : `Attribute ${attrId}`}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                                {value}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Icon icon="mdi:information-outline" className="text-lg" />
                    <span>This product has {Object.keys(product.variant_attributes).length} variant attribute{Object.keys(product.variant_attributes).length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
