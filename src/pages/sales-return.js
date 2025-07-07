import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import useSalesReturns from "../hooks/useSalesReturns";
import SalesReturnModals from "../components/SalesReturnModals";
import { GenericTable } from "../components/GenericTable";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import SalesReturnItemsEditor from "../components/SalesReturnItemsEditor";

export default function SalesReturnPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const {
    salesReturns,
    loading,
    error,
    addSalesReturn,
    updateSalesReturn,
    deleteSalesReturn,
    fetchSalesReturns,
  } = useSalesReturns();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [rowLineItems, setRowLineItems] = useState({});
  const [selectedReference, setSelectedReference] = useState("");
  const [products, setProducts] = useState([]);
  const [referenceOrderProducts, setReferenceOrderProducts] = useState([]);

  const openAddModal = () => {
    setEditItem(null);
    setLineItems([]);
    setSelectedReference("");
    setShowModal(true);
    setModalError(null);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setSelectedReference(item.reference || "");
    fetch(`/api/sales-return-items?sales_return_id=${item.id}`)
      .then((res) => res.json())
      .then(({ data }) => setLineItems(data || []));
    setShowModal(true);
    setModalError(null);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setModalError(null);
    setLineItems([]);
  };

  const handleSave = async (values, items) => {
    setModalLoading(true);
    setModalError(null);
    try {
      let ret;
      if (editItem) {
        ret = await updateSalesReturn(editItem.id, values);
      } else {
        ret = await addSalesReturn(values);
      }
      // Save line items
      await fetch("/api/sales-return-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          (items || lineItems).map((item) => ({
            ...item,
            sales_return_id: ret.id || ret.data?.id,
            total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
          }))
        ),
      });
      closeModal();
    } catch (err) {
      setModalError(err.message || "Failed to save sales return");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setModalLoading(true);
    setModalError(null);
    try {
      await fetch("/api/sales-return-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_return_id: id }),
      });
      await deleteSalesReturn(id);
      closeModal();
    } catch (err) {
      setModalError(err.message || "Failed to delete sales return");
    } finally {
      setModalLoading(false);
    }
  };

  // Expand/collapse handler
  const handleExpandRow = async (returnId) => {
    setExpandedRows((prev) =>
      prev.includes(returnId)
        ? prev.filter((id) => id !== returnId)
        : [...prev, returnId]
    );
    if (!rowLineItems[returnId]) {
      const res = await fetch(`/api/sales-return-items?sales_return_id=${returnId}`);
      const { data } = await res.json();
      setRowLineItems((prev) => ({ ...prev, [returnId]: data || [] }));
    }
  };

  // Fetch and autopopulate line items when reference changes
  useEffect(() => {
    if (selectedReference) {
      // Fetch order line items from API
      fetch(`/api/order-items?order_id=${selectedReference}`)
        .then((res) => res.json())
        .then(({ data }) => {
          if (Array.isArray(data)) {
            // Map order line items to return line items
            setLineItems(
              data.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
                reason: "",
                reason_text: "",
              }))
            );
          }
        });
    }
  }, [selectedReference]);

  useEffect(() => {
    // Fetch all products on mount
    fetch("/api/products")
      .then((res) => res.json())
      .then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    // Fetch products from referenced order when reference changes
    if (selectedReference) {
      fetch(`/api/order-items?order_id=${selectedReference}`)
        .then((res) => res.json())
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setReferenceOrderProducts(data);
          } else {
            setReferenceOrderProducts([]);
          }
        });
    } else {
      setReferenceOrderProducts([]);
    }
  }, [selectedReference]);

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-1">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Icon icon="prime:undo" className="w-7 h-7 text-blue-900" />
              Sales Returns
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your sales returns here.
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={salesReturns}
                columns={[
                  {
                    header: "",
                    accessor: "expand",
                    render: (row) => (
                      <button
                        onClick={() => handleExpandRow(row.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title={
                          expandedRows.includes(row.id) ? "Collapse" : "Expand"
                        }
                      >
                        <Icon
                          icon={
                            expandedRows.includes(row.id)
                              ? "mdi:chevron-up"
                              : "mdi:chevron-down"
                          }
                          className="w-5 h-5"
                        />
                      </button>
                    ),
                  },
                  {
                    header: "Return Number",
                    accessor: "return_number",
                    sortable: true,
                  },
                  {
                    header: "Customer",
                    accessor: "customer_name",
                    sortable: true,
                  },
                  { header: "Date", accessor: "date", sortable: true },
                  { header: "Status", accessor: "status", sortable: true },
                  {
                    header: "Total",
                    accessor: "total",
                    sortable: true,
                    render: (row) => `GHS ${row.total}`,
                  },
                ]}
                onEdit={openEditModal}
                onAddNew={openAddModal}
                addNewLabel="Add Sales Return"
                title="Sales Returns"
                emptyMessage="No sales returns found"
                customRowRender={(row, index, defaultRow) => (
                  <>
                    {defaultRow}
                    {expandedRows.includes(row.id) && (
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td colSpan={8} className="p-4">
                          <div className="font-semibold mb-2">Line Items</div>
                          <SalesReturnItemsEditor
                            lineItems={rowLineItems[row.id] || []}
                            setLineItems={(items) =>
                              setRowLineItems((prev) => ({
                                ...prev,
                                [row.id]: items,
                              }))
                            }
                            products={products}
                            referenceOrderProducts={referenceOrderProducts}
                            reference={selectedReference}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              />
            </div>
            <SalesReturnModals
              show={showModal}
              onClose={closeModal}
              onSave={handleSave}
              onDelete={editItem ? handleDelete : undefined}
              salesReturn={editItem}
              mode={mode}
              loading={modalLoading}
              error={modalError}
              selectedReference={selectedReference}
              onReferenceChange={setSelectedReference}
            >
              <SalesReturnItemsEditor
                lineItems={lineItems}
                setLineItems={setLineItems}
                products={products}
                referenceOrderProducts={referenceOrderProducts}
                reference={selectedReference}
              />
            </SalesReturnModals>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 