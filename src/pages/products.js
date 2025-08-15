import React, { useState, useEffect } from "react";
import CategoryCSVExport from "../components/CategoryCSVExport";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";
import Image from "next/image";
import ViewProductModal from "../components/ViewProductModal";
import useResponsive from "../hooks/useResponsive";

export default function ProductsPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const { isMobile, isTablet, getTableContainerClass } = useResponsive();

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View modal state
  const [viewItem, setViewItem] = useState(null);

  // Check for add query parameter to open modal
  useEffect(() => {
    if (router.query.add === "true") {
      openAddModal();
      // Remove the query parameter
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.add]);

  // Define columns for the products table with responsive handling
  const columns = [
    {
      Header: "SKU",
      accessor: "sku",
      sortable: true,
      className: isMobile ? "max-w-20 truncate" : isTablet ? "max-w-28" : "",
    },
    {
      Header: "Product Name",
      accessor: "name",
      sortable: true,
      className: isMobile ? "max-w-32" : isTablet ? "max-w-48" : "",
      render: (row) => (
        <span className="flex items-center gap-2">
          {row.image_url ? (
            <Image
              src={row.image_url}
              alt={row.name}
              width={32}
              height={32}
              className="rounded object-cover border w-8 h-8 flex-shrink-0"
            />
          ) : isMobile ? null : (
            <Icon
              icon="mdi:image-off-outline"
              className="rounded border w-8 h-8 text-gray-400 bg-gray-100 object-cover flex-shrink-0"
            />
          )}
          <span className={`${isMobile || isTablet ? "truncate" : ""}`}>
            {row.name}
          </span>
        </span>
      ),
    },
    {
      Header: "Category",
      accessor: "category_id",
      sortable: false,
      className: isMobile ? "max-w-20 truncate" : isTablet ? "max-w-28" : "",
      render: (row) => (
        <span className={`${isMobile || isTablet ? "truncate" : ""}`}>
          {row.category_name || "-"}
        </span>
      ),
    },
    {
      Header: "Brand",
      accessor: "brand_id",
      sortable: false,
      className: isMobile ? "max-w-20 truncate" : isTablet ? "max-w-28" : "",
      render: (row) => (
        <span className={`${isMobile || isTablet ? "truncate" : ""}`}>
          {row.brand_name || "-"}
        </span>
      ),
    },
    {
      Header: "Selling Price",
      accessor: "price",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => (
        <span className={`${isMobile ? "text-xs" : ""}`}>GHS {row.price}</span>
      ),
    },
    {
      Header: "Cost Price",
      accessor: "cost_price",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => (
        <span className={`${isMobile ? "text-xs" : ""}`}>
          GHS {row.cost_price || 0}
        </span>
      ),
    },
    {
      Header: "Tax",
      accessor: "tax_type",
      sortable: true,
      render: (row) => {
        if (!row.tax_type || !row.tax_percentage) {
          return <span className="text-gray-400">No Tax</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                row.tax_type === "inclusive"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {row.tax_type === "inclusive" ? "Inclusive" : "Exclusive"}
            </span>
            <span className="text-xs text-gray-600">{row.tax_percentage}%</span>
          </div>
        );
      },
    },
    {
      Header: "Unit",
      accessor: "unit_id",
      sortable: false,
      className: isMobile ? "max-w-16 truncate" : isTablet ? "max-w-24" : "",
      render: (row) => (
        <span className={`${isMobile || isTablet ? "truncate" : ""}`}>
          {row.unit_name || "-"}
        </span>
      ),
    },
    {
      Header: "Qty",
      accessor: "quantity",
      sortable: true,
      className: isMobile ? "max-w-16" : isTablet ? "max-w-24" : "",
    },
    {
      Header: "Specs",
      accessor: "variant_attributes",
      sortable: false,
      render: (row) => {
        // Handle variant_attributes that might be stored as string or object
        let variantData = row.variant_attributes;

        // If it's a string, try to parse it as JSON
        if (typeof variantData === "string") {
          try {
            variantData = JSON.parse(variantData);
          } catch (e) {
            console.error("Failed to parse variant_attributes:", e);
            variantData = null;
          }
        }

        if (
          !variantData ||
          Object.keys(variantData).length === 0 ||
          Object.values(variantData).every((value) => !value || value === "")
        ) {
          return <span className="text-gray-400">-</span>;
        }

        // Check if the data is malformed (contains very long keys or corrupted data)
        const hasMalformedData = Object.entries(variantData).some(
          ([key, value]) => {
            return (
              key.length > 50 ||
              (typeof value === "string" && value.length > 100)
            );
          },
        );

        if (hasMalformedData) {
          console.warn("Malformed variant_attributes detected:", variantData);
          return (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-red-600 font-medium">
                Data Error
              </span>
              <span className="text-xs text-gray-500">
                Check console for details
              </span>
            </div>
          );
        }

        return (
          <div
            className={`flex flex-wrap gap-1 ${isMobile || isTablet ? "max-w-36 overflow-hidden" : ""}`}
          >
            {Object.entries(variantData)
              .filter(([attrId, value]) => value && value !== "")
              .slice(0, isMobile ? 2 : isTablet ? 3 : undefined)
              .map(([attrId, value]) => (
                <span
                  key={attrId}
                  className={`px-2 py-1 bg-blue-100 text-blue-800 rounded-full ${isMobile ? "text-xs" : "text-xs"}`}
                >
                  {isMobile || isTablet
                    ? value.length > 8
                      ? value.substring(0, 8) + "..."
                      : value
                    : value}
                </span>
              ))}
            {isMobile &&
              Object.entries(variantData).filter(
                ([attrId, value]) => value && value !== "",
              ).length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +
                  {Object.entries(variantData).filter(
                    ([attrId, value]) => value && value !== "",
                  ).length - 2}
                </span>
              )}
            {isTablet &&
              Object.entries(variantData).filter(
                ([attrId, value]) => value && value !== "",
              ).length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +
                  {Object.entries(variantData).filter(
                    ([attrId, value]) => value && value !== "",
                  ).length - 3}
                </span>
              )}
          </div>
        );
      },
    },
  ];

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products");
      const { data, error } = await response.json();

      if (!response.ok) {
        throw new Error(error || "Failed to load products");
      }

      setProducts(data || []);
    } catch (err) {
      setError(err.message || "Failed to load products");
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Open product modal if viewProductId is in the query
  useEffect(() => {
    if (!router.isReady) return;
    const { viewProductId } = router.query;
    if (viewProductId) {
      // Try to find the product in the loaded products
      let product = products.find((p) => p.id === viewProductId);
      if (!product) {
        // If not found, fetch it
        fetch(`/api/products/${viewProductId}`)
          .then((res) => res.json())
          .then(({ data }) => {
            if (data) setViewItem(data);
          });
      } else {
        setViewItem(product);
      }
    }
  }, [router.isReady, router.query.viewProductId, products]);

  // Modal open/close helpers
  const openAddModal = () => {
    setEditItem(null);
    setShowModal(true);
  };
  const openEditModal = (item) => {
    setEditItem(item);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
  };
  const handleDelete = async (item) => {
    if (!item) return;
    try {
      const response = await fetch(`/api/products/${item.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setProducts((prev) => prev.filter((p) => p.id !== item.id));
      toast.success("Product deleted!");
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  // Add a helper to add a new product
  const handleAddProduct = async (newProduct) => {
    // Insert the product
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProduct),
    });
    const { data, error } = await response.json();
    if (error) throw error;

    // Fetch the full product row with joins using the correct select string
    const selectResponse = await fetch(`/api/products/${data.id}`);
    const { data: fullData, error: fetchError } = await selectResponse.json();
    if (fetchError) throw fetchError;

    // Add the new product with joined fields to the state
    const newProductWithJoins = {
      ...fullData,
      category_name: fullData.category_name || "",
      brand_name: fullData.brand_name || "",
      unit_name: fullData.unit_name || "",
    };

    setProducts((prev) => [newProductWithJoins, ...prev]);
  };

  // Add a helper to update a product
  const handleUpdateProduct = async (id, updatedFields) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedFields),
    });
    const { data, error } = await response.json();
    if (error) throw error;

    // Fetch the full product row with joins to get updated category, unit, brand names
    const selectResponse = await fetch(`/api/products/${id}`);
    const { data: fullData, error: fetchError } = await selectResponse.json();
    if (fetchError) throw fetchError;

    // Update the product with joined fields
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updatedFields,
              category_name: fullData.category_name || "",
              brand_name: fullData.brand_name || "",
              unit_name: fullData.unit_name || "",
            }
          : p,
      ),
    );
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  // When closing the modal, remove viewProductId from the URL
  const closeViewModal = () => {
    setViewItem(null);

    // Update URL without scrolling
    const { viewProductId, ...rest } = router.query;
    const url = {
      pathname: router.pathname,
      query: rest,
    };

    // Use history.replaceState to avoid Next.js router scroll behavior
    const newUrl =
      router.asPath.split("?")[0] +
      (Object.keys(rest).length > 0
        ? "?" + new URLSearchParams(rest).toString()
        : "");
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      "",
      newUrl,
    );
  };

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-1 overflow-hidden pt-0 md:pt-14">
        <div
          className={`flex-1 overflow-hidden ${isMobile ? "p-2" : isTablet ? "p-4" : "p-4 md:p-6 lg:p-8"}`}
        >
          <div
            className={`${isMobile || isTablet ? "w-full" : "max-w-7xl"} mx-auto overflow-hidden`}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:package-variant"
                  className="w-6 h-6 text-white"
                />
              </div>
              Products
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your shop products here.
            </p>

            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <div
              className={`${isMobile ? "rounded-lg" : "rounded-xl"} ${
                mode === "dark" ? "bg-gray-900" : "bg-white"
              } overflow-hidden`}
            >
              <div className={`w-full ${getTableContainerClass()}`}>
                <GenericTable
                  mode={mode}
                  data={products}
                  columns={columns}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onAddNew={openAddModal}
                  onRefresh={fetchProducts}
                  addNewLabel="Add New Product"
                  actions={[
                    {
                      label: "View",
                      icon: "mdi:eye-outline",
                      onClick: (item) => setViewItem(item),
                    },
                  ]}
                />
              </div>
            </div>

            <AddEditModal
              isOpen={showModal}
                type="products"
                mode={mode}
                item={editItem}
                categories={[]}
                onClose={closeModal}
                onSave={async (values) => {
                  try {
                    if (!editItem) {
                      await handleAddProduct(values);
                      toast.success("Product added!");
                      closeModal();
                    } else {
                      await handleUpdateProduct(editItem.id, values);
                      toast.success("Product updated!");
                      closeModal();
                    }
                  } catch (err) {
                    toast.error(err.message || "Failed to save product");
                  }
                }}
              />
            {errorModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setErrorModal({ open: false, message: "" })}
                title="Duplicate Product"
                mode={mode}
                width="max-w-md"
              >
                <div className="py-6 text-center">
                  <Icon
                    icon="mdi:alert-circle"
                    className="w-12 h-12 text-red-500 mx-auto mb-4"
                  />
                  <div className="text-lg font-semibold mb-2">
                    {errorModal.message}
                  </div>
                  <button
                    className="mt-4 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => setErrorModal({ open: false, message: "" })}
                  >
                    Close
                  </button>
                </div>
              </SimpleModal>
            )}
            {viewItem && (
              <ViewProductModal
                product={viewItem}
                isOpen={!!viewItem}
                onClose={closeViewModal}
                mode={mode}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
