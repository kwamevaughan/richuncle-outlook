import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import useSalesReturns from "../hooks/useSalesReturns";
import SalesReturnModals from "../components/SalesReturnModals";
import { GenericTable } from "../components/GenericTable";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import SalesReturnItemsEditor from "../components/SalesReturnItemsEditor";
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchSalesReturns();
  }, [fetchSalesReturns]);

  const [expandedRows, setExpandedRows] = useState([]);
  const [rowLineItems, setRowLineItems] = useState({});
  const [selectedReference, setSelectedReference] = useState("");
  const [products, setProducts] = useState([]);
  const [referenceOrderProducts, setReferenceOrderProducts] = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [rowReferenceOrderProducts, setRowReferenceOrderProducts] = useState({});
  const [orders, setOrders] = useState([]);

  // Expand/collapse handler
  const handleExpandRow = async (returnId, reference) => {
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
    if (reference && !rowReferenceOrderProducts[returnId]) {
      const res = await fetch(`/api/order-items?order_id=${reference}`);
      const { data } = await res.json();
      setRowReferenceOrderProducts((prev) => ({ ...prev, [returnId]: data || [] }));
    }
  };

  // Fetch and autopopulate line items when reference changes
  useEffect(() => {
    if (selectedReference) {
      fetch(`/api/order-items?order_id=${selectedReference}`)
        .then((res) => res.json())
        .then(({ data }) => {
          if (Array.isArray(data) && products.length > 0) {
            // setLineItems( // This line is removed as per the edit hint
            //   data
            //     .map((item) => {
            //       // Find product by UUID or old_id
            //       const product = products.find(
            //         (p) =>
            //           String(p.id) === String(item.product_id) ||
            //           (p.old_id && String(p.old_id) === String(item.product_id))
            //       );
            //       if (!product) return null; // skip if not found
            //       return {
            //         product_id: product.id, // always UUID
            //         quantity: item.quantity,
            //         unit_price: item.unit_price,
            //         total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
            //         reason: "",
            //         reason_text: "",
            //       };
            //     })
            //     .filter(Boolean)
            // );
          }
        });
    }
  }, [selectedReference, products]);

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

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(({ data }) => setOrders(data || []));
  }, []);

  const handleApprove = async (row) => {
    try {
      await updateSalesReturn(row.id, { status: 'Returned' });
      toast.success('Sales return approved!');
      fetchSalesReturns();
    } catch (err) {
      toast.error('Failed to approve sales return');
    }
  };
  const handleCancel = async (row) => {
    try {
      await updateSalesReturn(row.id, { status: 'Cancelled' });
      toast.success('Sales return cancelled!');
      fetchSalesReturns();
    } catch (err) {
      toast.error('Failed to cancel sales return');
    }
  };

  const handleView = async (row) => {
    setSelectedReference(row.reference || "");
    // Fetch line items for this sales return
    const res = await fetch(`/api/sales-return-items?sales_return_id=${row.id}`);
    const { data } = await res.json();
    setRowLineItems((prev) => ({ ...prev, [row.id]: data || [] }));
    setViewItem(row);
    setShowViewModal(true);
  };

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
                        onClick={() => handleExpandRow(row.id, row.reference)}
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
                    render: row => row.customer_name || "Walk In Customer"
                  },
                  { header: "Date", accessor: "date", sortable: true },
                  { header: "Status", accessor: "status", sortable: true },
                  {
                    header: "Total",
                    accessor: "total",
                    sortable: true,
                    render: (row) => `GHS ${row.total}`,
                  },
                  {
                    header: 'Actions',
                    accessor: 'actions',
                    render: (row) => (
                      <div className="flex gap-2">
                        {row.status === 'Pending' && (
                          <>
                            <button
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                              onClick={() => handleApprove(row)}
                            >
                              Approve
                            </button>
                            <button
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                              onClick={() => handleCancel(row)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                          onClick={() => handleView(row)}
                        >
                          View
                        </button>
                      </div>
                    ),
                  },
                ]}
                // Remove onEdit, onAddNew, addNewLabel, title, emptyMessage, customRowRender for add/edit
                customRowRender={(row, index, defaultRow) => (
                  <>
                    {defaultRow}
                    {expandedRows.includes(row.id) && (
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td colSpan={8} className="p-4">
                          {/* <div className="font-semibold mb-2">Line Items</div> */}
                          <SalesReturnItemsEditor
                            lineItems={rowLineItems[row.id] || []}
                            setLineItems={(items) =>
                              setRowLineItems((prev) => ({
                                ...prev,
                                [row.id]: items,
                              }))
                            }
                            products={products}
                            referenceOrderProducts={rowReferenceOrderProducts[row.id] || []}
                            reference={row.reference}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              />
            </div>
            {showViewModal && viewItem && (
              <SalesReturnModals
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                salesReturn={viewItem}
                mode={mode}
                selectedReference={selectedReference}
                onReferenceChange={setSelectedReference}
                orders={orders}
                // Pass any other required props
              >
                <SalesReturnItemsEditor
                  lineItems={rowLineItems[viewItem.id] || []}
                  setLineItems={(items) =>
                    setRowLineItems((prev) => ({
                      ...prev,
                      [viewItem.id]: items,
                    }))
                  }
                  products={products}
                  referenceOrderProducts={referenceOrderProducts}
                  reference={selectedReference}
                />
              </SalesReturnModals>
            )}
            {/* Remove SalesReturnModals */}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 