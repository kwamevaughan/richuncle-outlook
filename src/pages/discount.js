import React, { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";
import SimpleModal from "../components/SimpleModal";
import ExportModal from "../components/export/ExportModal";

export default function DiscountPage({ mode = "light", toggleMode, ...props }) {
  const [tab, setTab] = useState("discounts");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [discounts, setDiscounts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Set initial tab based on URL query parameter
  React.useEffect(() => {
    if (router.query.tab === 'discounts') {
      setTab('discounts');
    } else if (router.query.tab === 'plans') {
      setTab('plans');
    }
  }, [router.query.tab]);

  // Fetch discounts and plans
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discounts');
      const result = await response.json();
      if (result.success) {
        setDiscounts(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch discounts:", err);
    }
    setLoading(false);
  };
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discount-plans');
      const result = await response.json();
      if (result.success) {
        setPlans(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    }
    setLoading(false);
  };

  // Initial fetch
  React.useEffect(() => {
    fetchDiscounts();
    fetchPlans();
  }, []);

  // Filtered data
  const filteredDiscounts = discounts.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPlans = plans.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Flatten data for export to prevent nested object errors
  const flattenObject = (obj) => {
    const result = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const value = obj[key];
      if (value === null || value === undefined) {
        result[key] = '';
      } else if (typeof value === 'object') {
        // If it's an array, show count; if object, JSON.stringify
        if (Array.isArray(value)) {
          result[key] = `Array(${value.length})`;
        } else if (value && value.name) {
          result[key] = value.name;
        } else {
          result[key] = JSON.stringify(value);
        }
      } else {
        result[key] = String(value);
      }
    }
    return result;
  };

  const flattenedDiscounts = discounts.map(discount => flattenObject({
    id: discount.id,
    name: discount.name,
    discount_code: discount.discount_code,
    value: discount.value,
    discount_type: discount.discount_type,
    plan_name: discount.discount_plans?.name,
    store_name: discount.store?.name || 'All Stores',
    validity: discount.validity,
    is_active: discount.is_active,
    created_at: discount.created_at,
    updated_at: discount.updated_at
  }));

  const flattenedPlans = plans.map(plan => flattenObject(plan));

  // Modal helpers
  const openAddModal = (type) => {
    if (type === "discounts" && (!plans || plans.length === 0)) {
      toast.error("Please create a Discount Plan first.");
      return;
    }
    setModalType("add");
    setEditItem(null);
    setShowModal(true);
  };
  const openEditModal = (type, item) => {
    setModalType("edit");
    setEditItem(item);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
  };
  const openConfirm = (item) => {
    setDeleteItem(item);
    setShowConfirm(true);
  };
  const closeConfirm = () => {
    setDeleteItem(null);
    setShowConfirm(false);
  };
  const handleDelete = async () => {
    try {
      if (tab === "discounts") {
        const response = await fetch(`/api/discounts/${deleteItem.id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          setDiscounts((prev) => prev.filter((d) => d.id !== deleteItem.id));
        } else {
          throw new Error(result.error || "Failed to delete discount");
        }
      } else {
        const response = await fetch(`/api/discount-plans/${deleteItem.id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          setPlans((prev) => prev.filter((p) => p.id !== deleteItem.id));
        } else {
          throw new Error(result.error || "Failed to delete plan");
        }
      }
      closeConfirm();
      toast.success("Deleted!");
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // Add/update helpers
  const handleAddDiscount = async (newDiscount) => {
    const response = await fetch('/api/discounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newDiscount)
    });
    const result = await response.json();
    if (result.success) {
      await fetchDiscounts();
    } else {
      throw new Error(result.error || "Failed to add discount");
    }
  };
  const handleUpdateDiscount = async (id, updatedFields) => {
    const response = await fetch(`/api/discounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFields)
    });
    const result = await response.json();
    if (result.success) {
      await fetchDiscounts();
    } else {
      throw new Error(result.error || "Failed to update discount");
    }
  };
  const handleAddPlan = async (newPlan) => {
    const response = await fetch('/api/discount-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPlan)
    });
    const result = await response.json();
    if (result.success) {
      setPlans((prev) => [result.data, ...prev]);
    } else {
      throw new Error(result.error || "Failed to add plan");
    }
  };
  const handleUpdatePlan = async (id, updatedFields) => {
    const response = await fetch(`/api/discount-plans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFields)
    });
    const result = await response.json();
    if (result.success) {
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
      );
    } else {
      throw new Error(result.error || "Failed to update plan");
    }
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
      <div className="flex flex-1 bg-gray-50 min-h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:percent"
                        className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                      />
                    </div>
                    Discounts
                  </h1>
                  <p className="text-gray-600">
                    Manage discounts and discount plans for your business
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      fetchDiscounts();
                      fetchPlans();
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Icon icon="mdi:refresh" className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:percent"
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {discounts.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Discounts
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:check-circle"
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {discounts.filter((d) => d.is_active).length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Active Discounts
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:package-variant"
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {plans.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Discount Plans
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:calendar-check"
                        className="w-5 h-5 text-orange-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {plans.filter((p) => p.is_active).length}
                      </div>
                      <div className="text-sm text-gray-500">Active Plans</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Icon
                    icon="mdi:magnify"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search discounts and plans..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 mb-0">
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-6 py-4 font-semibold text-sm transition-all duration-200 border-b-2 focus:outline-none ${
                    tab === "discounts"
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setTab("discounts");
                    router.replace(
                      {
                        pathname: router.pathname,
                        query: { ...router.query, tab: "discounts" },
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:percent" className="w-4 h-4" />
                    Discounts ({discounts.length})
                  </div>
                </button>
                <button
                  className={`px-6 py-4 font-semibold text-sm transition-all duration-200 border-b-2 focus:outline-none ${
                    tab === "plans"
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setTab("plans");
                    router.replace(
                      {
                        pathname: router.pathname,
                        query: { ...router.query, tab: "plans" },
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:package-variant" className="w-4 h-4" />
                    Discount Plans ({plans.length})
                  </div>
                </button>
              </div>
            </div>

            {/* Content Area */}
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <div className="bg-white rounded-b-xl shadow-sm border border-gray-200">
              {tab === "discounts" ? (
                <GenericTable
                  data={filteredDiscounts}
                  columns={[
                    { Header: "Name", accessor: "name", sortable: true },
                    {
                      Header: "Code",
                      accessor: "discount_code",
                      sortable: true,
                      render: (row) => (
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {row.discount_code || "N/A"}
                        </span>
                      ),
                    },
                    {
                      Header: "Value",
                      accessor: "value",
                      sortable: true,
                      render: (row) => (
                        <div>
                          <span className="font-semibold text-blue-600">
                            {row.discount_type === "fixed"
                              ? `GHS ${row.value}`
                              : `${row.value}%`}
                          </span>
                          <div className="text-xs text-gray-500">
                            {row.discount_type === "fixed"
                              ? "Fixed Amount"
                              : "Percentage"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      Header: "Discount Plan",
                      accessor: "plan_id",
                      sortable: false,
                      render: (row) => row.discount_plans?.name || "-",
                    },
                    {
                      Header: "Store",
                      accessor: "store_id",
                      sortable: false,
                      render: (row) => row.store?.name || "All Stores",
                    },
                    {
                      Header: "Validity",
                      accessor: "validity",
                      sortable: true,
                      render: (row) => {
                        if (!row.validity) return "-";
                        const [start, end] = row.validity.split(" to ");
                        return (
                          <div className="text-xs">
                            <div className="text-gray-600">
                              From: {new Date(start).toLocaleDateString()}
                            </div>
                            <div className="text-gray-600">
                              To: {new Date(end).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      Header: "Status",
                      accessor: "is_active",
                      sortable: true,
                      render: (row) => (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            row.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </span>
                      ),
                    },
                  ]}
                  onEdit={(item) => openEditModal("discounts", item)}
                  onDelete={openConfirm}
                  onAddNew={() => openAddModal("discounts")}
                  addNewLabel="Add New Discount"
                  onExport={() => setShowExportModal(true)}
                  emptyMessage={
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <Icon icon="mdi:percent-off" className="w-12 h-12 mb-2" />
                      <div>No discounts found</div>
                    </div>
                  }
                />
              ) : (
                <GenericTable
                  data={filteredPlans}
                  columns={[
                    { Header: "Plan Name", accessor: "name", sortable: true },
                    {
                      Header: "Description",
                      accessor: "description",
                      sortable: false,
                      render: (row) => (
                        <div className="max-w-xs">
                          <span className="text-sm text-gray-600">
                            {row.description || "No description"}
                          </span>
                        </div>
                      ),
                    },
                    {
                      Header: "Status",
                      accessor: "is_active",
                      sortable: true,
                      render: (row) => (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            row.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </span>
                      ),
                    },
                  ]}
                  onEdit={(item) => openEditModal("plans", item)}
                  onDelete={openConfirm}
                  onAddNew={() => openAddModal("plans")}
                  addNewLabel="Add New Discount Plan"
                  onExport={() => setShowExportModal(true)}
                  emptyMessage={
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <Icon
                        icon="mdi:package-variant-off"
                        className="w-12 h-12 mb-2"
                      />
                      <div>No discount plans found</div>
                    </div>
                  }
                />
              )}
            </div>
            {showModal && (
              <AddEditModal
                type={tab}
                mode={mode}
                item={editItem}
                categories={tab === "discounts" ? plans : discounts}
                onClose={closeModal}
                onSave={async (values) => {
                  try {
                    if (tab === "discounts" && !editItem) {
                      await handleAddDiscount(values);
                      toast.success("Discount added!");
                      closeModal();
                    } else if (tab === "discounts" && editItem) {
                      await handleUpdateDiscount(editItem.id, values);
                      toast.success("Discount updated!");
                      closeModal();
                    } else if (tab === "plans" && !editItem) {
                      await handleAddPlan(values);
                      toast.success("Plan added!");
                      closeModal();
                    } else if (tab === "plans" && editItem) {
                      await handleUpdatePlan(editItem.id, values);
                      toast.success("Plan updated!");
                      closeModal();
                    } else {
                      closeModal();
                    }
                  } catch (err) {
                    setErrorModal({
                      open: true,
                      message: err.message || "Failed to save",
                    });
                  }
                }}
              />
            )}
            {errorModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setErrorModal({ open: false, message: "" })}
                title="Error"
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
            {showConfirm && (
              <SimpleModal
                isOpen={true}
                onClose={closeConfirm}
                title="Confirm Delete"
                mode={mode}
                width="max-w-md"
              >
                <div className="py-6 text-center">
                  <Icon
                    icon="mdi:alert"
                    className="w-12 h-12 text-red-500 mx-auto mb-4"
                  />
                  <div className="text-lg font-semibold mb-2">
                    Are you sure you want to delete{" "}
                    {deleteItem?.name || deleteItem?.id}?
                  </div>
                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                      onClick={closeConfirm}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </SimpleModal>
            )}
            <ExportModal
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              users={tab === "discounts" ? flattenedDiscounts : flattenedPlans}
              mode={mode}
              type={tab === "discounts" ? "discounts" : "discount-plans"}
              title={`Export ${
                tab === "discounts" ? "Discounts" : "Discount Plans"
              } Data`}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}