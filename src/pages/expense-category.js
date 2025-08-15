import { useState, useEffect } from "react";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";
import Link from "next/link";

export default function ExpenseCategoryPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Expense categories state
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch expense categories
  const fetchExpenseCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/expense-categories');
      const { data, error } = await response.json();
      
      if (!response.ok) {
        throw new Error(error || 'Failed to load expense categories');
      }
      
      setExpenseCategories(data || []);
    } catch (err) {
      setError(err.message || "Failed to load expense categories");
      toast.error("Failed to load expense categories");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchExpenseCategories();
  }, []);

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
      const response = await fetch(`/api/expense-categories/${deleteItem.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setExpenseCategories((prev) => prev.filter((cat) => cat.id !== deleteItem.id));
      closeConfirm();
      toast.success("Expense category deleted!");
    } catch (err) {
      toast.error(err.message || "Failed to delete expense category");
    }
  };

  // Add a helper to add a new expense category
  const handleAddExpenseCategory = async (newCategory) => {
    const response = await fetch('/api/expense-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCategory),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setExpenseCategories((prev) => [data, ...prev]);
  };

  // Add a helper to update an expense category
  const handleUpdateExpenseCategory = async (id, updatedFields) => {
    const response = await fetch(`/api/expense-categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedFields),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setExpenseCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updatedFields } : cat))
    );
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
      <div className="flex flex-1 pt-0 md:pt-14">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                    <Icon
                      icon="mdi:folder-outline"
                      className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                    />
                  </div>
                  Expense Categories
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                  Manage your expense categories here.
                </p>
              </div>
              <Link href="/expenses">
                <button className="bg-blue-900 text-white px-4 py-2 rounded-lg">
                  Back to Expenses
                </button>
              </Link>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={expenseCategories}
                columns={[
                  { Header: "Name", accessor: "name", sortable: true },
                  {
                    Header: "Description",
                    accessor: "description",
                    sortable: false,
                  },
                  {
                    Header: "Created At",
                    accessor: "created_at",
                    sortable: true,
                    render: (row) =>
                      new Date(row.created_at).toLocaleDateString(),
                  },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add Expense Category"
                emptyMessage="No expense categories available"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
                  <AddEditModal
              isOpen={showModal}
          type="expense-categories"
          mode={mode}
          item={editItem}
          onClose={closeModal}
          onSave={async (data) => {
            try {
              if (editItem) {
                await handleUpdateExpenseCategory(editItem.id, data);
                toast.success("Expense category updated!");
              } else {
                await handleAddExpenseCategory(data);
                toast.success("Expense category added!");
              }
              closeModal();
            } catch (err) {
              toast.error(err.message || "Failed to save expense category");
            }
                          }}
              />

      {/* Delete Confirmation Modal */}
      <SimpleModal
        isOpen={showConfirm}
        onClose={closeConfirm}
        title="Delete Expense Category"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Error Modal */}
      <SimpleModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: "" })}
        title="Error"
        message={errorModal.message}
        confirmText="OK"
        showCancel={false}
      />
    </MainLayout>
  );
} 