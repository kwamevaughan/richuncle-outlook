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
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

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

  // Modal helpers
  const openAddModal = (type) => {
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
    <MainLayout mode={mode} user={user} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
      <div className="flex flex-1">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Icon icon="mdi:percent" className="w-7 h-7 text-blue-900" />
              Discount Management
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage discounts and discount plans here.
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 border-b-2 focus:outline-none ${
                  tab === "discounts"
                    ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-900"
                    : "border-transparent text-gray-500 bg-gray-50 dark:bg-gray-800"
                }`}
                onClick={() => setTab("discounts")}
              >
                Discounts
              </button>
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 border-b-2 focus:outline-none ${
                  tab === "plans"
                    ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-900"
                    : "border-transparent text-gray-500 bg-gray-50 dark:bg-gray-800"
                }`}
                onClick={() => setTab("plans")}
              >
                Discount Plans
              </button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              {tab === "discounts" ? (
                <GenericTable
                  data={filteredDiscounts}
                  columns={[
                    { header: "Name", accessor: "name", sortable: true },
                    { header: "Value", accessor: "value", sortable: true },
                    {
                      header: "Discount Plan",
                      accessor: "plan_id",
                      sortable: false,
                      render: (row) => row.plan?.name || "-",
                    },
                    { header: "Validity", accessor: "validity", sortable: true },
                    {
                      header: "Status",
                      accessor: "is_active",
                      sortable: true,
                      render: (row) => (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                          {row.is_active ? "Active" : "Inactive"}
                        </span>
                      ),
                    },
                  ]}
                  onEdit={(item) => openEditModal("discounts", item)}
                  onDelete={openConfirm}
                  onAddNew={() => openAddModal("discounts")}
                  addNewLabel="Add New Discount"
                />
              ) : (
                <GenericTable
                  data={filteredPlans}
                  columns={[
                    { header: "Plan Name", accessor: "name", sortable: true },
                    {
                      header: "Status",
                      accessor: "is_active",
                      sortable: true,
                      render: (row) => (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                          {row.is_active ? "Active" : "Inactive"}
                        </span>
                      ),
                    },
                  ]}
                  onEdit={(item) => openEditModal("plans", item)}
                  onDelete={openConfirm}
                  onAddNew={() => openAddModal("plans")}
                  addNewLabel="Add New Discount Plan"
                />
              )}
            </div>
            {showModal && (
              <AddEditModal
                type={tab}
                mode={mode}
                item={editItem}
                categories={plans}
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
                    setErrorModal({ open: true, message: err.message || "Failed to save" });
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
                    Are you sure you want to delete {deleteItem?.name || deleteItem?.id}?
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 