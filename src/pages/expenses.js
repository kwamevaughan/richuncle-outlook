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
import DateRangePicker from "@/components/DateRangePicker";
import ExpenseStatsCard from "@/components/ExpenseStatsCard";
import ExpenseChart from "@/components/ExpenseChart";

export default function ExpensesPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Expenses state
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: startOfMonth, endDate: today, label: "This Month" };
  });

  // Stats state
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    averageAmount: 0,
    thisMonth: 0
  });

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/expenses');
      const { data, error } = await response.json();
      
      if (!response.ok) {
        throw new Error(error || 'Failed to load expenses');
      }
      
      setExpenses(data || []);
      calculateStats(data || []);
    } catch (err) {
      setError(err.message || "Failed to load expenses");
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (expenseData) => {
    const total = expenseData.length;
    const totalAmount = expenseData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const averageAmount = total > 0 ? totalAmount / total : 0;
    
    // Calculate this month's expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = expenseData
      .filter(expense => new Date(expense.expense_date) >= startOfMonth)
      .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

    setStats({ totalExpenses: total, totalAmount, averageAmount, thisMonth });
  };

  // Filter expenses by date range
  const filteredExpenses = expenses.filter(expense => {
    if (!expense.expense_date) return false;
    const expenseDate = new Date(expense.expense_date);
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    return expenseDate >= start && expenseDate <= end;
  });

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
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
      const response = await fetch(`/api/expenses/${deleteItem.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setExpenses((prev) => prev.filter((expense) => expense.id !== deleteItem.id));
      closeConfirm();
      toast.success("Expense deleted!");
    } catch (err) {
      toast.error(err.message || "Failed to delete expense");
    }
  };

  // Add a helper to add a new expense
  const handleAddExpense = async (newExpense) => {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newExpense),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setExpenses((prev) => [data, ...prev]);
  };

  // Add a helper to update an expense
  const handleUpdateExpense = async (id, updatedFields) => {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedFields),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setExpenses((prev) =>
      prev.map((expense) => (expense.id === id ? { ...expense, ...updatedFields } : expense))
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
      <div className="flex flex-1">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Icon
                  icon="mdi:file-document-outline"
                  className="w-7 h-7 text-white"
                />
              </div>{" "}
              Expenses Management
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Track and manage your business expenses here.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <ExpenseStatsCard
                title="Total Expenses"
                value={stats.totalExpenses}
                icon="mdi:file-document-outline"
                color="blue"
              />
              <ExpenseStatsCard
                title="Total Amount"
                value={`GHS ${stats.totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon="fa7-solid:cedi-sign"
                color="green"
              />
              <ExpenseStatsCard
                title="Average Amount"
                value={`GHS ${stats.averageAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon="mdi:chart-line"
                color="purple"
              />
              <ExpenseStatsCard
                title="This Month"
                value={`GHS ${stats.thisMonth.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                icon="mdi:calendar-month"
                color="orange"
              />
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Expenses
                </h2>
                <p className="text-sm text-gray-500">
                  Showing {filteredExpenses.length} expenses
                </p>
              </div>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <ExpenseChart
                  expenses={filteredExpenses}
                  dateRange={dateRange}
                />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                  <Icon
                    icon="mdi:lightning-bolt"
                    className="w-6 h-6 text-blue-500"
                  />
                </div>
                <div className="space-y-3">
                  <button
                    onClick={openAddModal}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:plus" className="w-5 h-5" />
                    Add New Expense
                  </button>
                  <button
                    onClick={() => router.push("/expense-category")}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:folder-outline" className="w-5 h-5" />
                    Manage Categories
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={filteredExpenses}
                columns={[
                  { Header: "Title", accessor: "title", sortable: true },
                  {
                    Header: "Category",
                    accessor: "category_name",
                    sortable: false,
                    render: (row) => row.category_name || "Uncategorized",
                  },
                  {
                    Header: "Amount",
                    accessor: "amount",
                    sortable: true,
                    render: (row) =>
                      `GHS ${parseFloat(row.amount || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`,
                  },
                  {
                    Header: "Date",
                    accessor: "expense_date",
                    sortable: true,
                    render: (row) =>
                      new Date(row.expense_date).toLocaleDateString(),
                  },
                  {
                    Header: "Payment Method",
                    accessor: "payment_method",
                    sortable: true,
                    render: (row) => (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          row.payment_method === "cash"
                            ? "bg-green-100 text-green-800"
                            : row.payment_method === "momo"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.payment_method?.replace("_", " ").toUpperCase() ||
                          "N/A"}
                      </span>
                    ),
                  },
                  {
                    Header: "Status",
                    accessor: "status",
                    sortable: true,
                    render: (row) => (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          row.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : row.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.status?.toUpperCase() || "UNKNOWN"}
                      </span>
                    ),
                  },
                  {
                    Header: "Description",
                    accessor: "description",
                    sortable: false,
                    render: (row) =>
                      row.description
                        ? row.description.length > 50
                          ? row.description.substring(0, 50) + "..."
                          : row.description
                        : "-",
                  },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add Expense"
                title="Expenses"
                emptyMessage="No expenses available"
                enableDateFilter={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditModal
          type="expenses"
          mode={mode}
          item={editItem}
          onClose={closeModal}
          onSave={async (data) => {
            try {
              if (editItem) {
                await handleUpdateExpense(editItem.id, data);
                toast.success("Expense updated!");
              } else {
                await handleAddExpense(data);
                toast.success("Expense added!");
              }
              closeModal();
            } catch (err) {
              toast.error(err.message || "Failed to save expense");
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <SimpleModal
        isOpen={showConfirm}
        onClose={closeConfirm}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`}
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