import React, { useState, useEffect } from "react";
import CategoryCSVExport from "../components/CategoryCSVExport";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";
import Header from "../layouts/header";
import Sidebar from "../layouts/sidebar";
import useSidebar from "../hooks/useSidebar";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import Footer from "../layouts/footer";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";
import Image from "next/image";

export default function CustomersPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const { isSidebarOpen, toggleSidebar, isMobile, windowWidth } = useSidebar();
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers');
      const result = await response.json();
      if (result.success) {
        setCustomers(result.data || []);
      } else {
        setError("Failed to load customers");
      }
    } catch (err) {
      setError("Failed to load customers");
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Check for add query parameter to open modal
  useEffect(() => {
    if (router.query.add === 'true') {
      openAddModal();
      // Remove the query parameter
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.add]);

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
      const response = await fetch(`/api/customers/${deleteItem.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== deleteItem.id));
        closeConfirm();
        toast.success("Customer deleted!");
      } else {
        throw new Error(result.error || "Failed to delete customer");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete customer");
    }
  };

  // Add a helper to add a new customer
  const handleAddCustomer = async (newCustomer) => {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCustomer)
    });
    const result = await response.json();
    if (result.success) {
      setCustomers((prev) => [result.data, ...prev]);
    } else {
      throw new Error(result.error || "Failed to add customer");
    }
  };

  // Add a helper to update a customer
  const handleUpdateCustomer = async (id, updatedFields) => {
    const response = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFields)
    });
    const result = await response.json();
    if (result.success) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
      );
    } else {
      throw new Error(result.error || "Failed to update customer");
    }
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user || windowWidth === null) {
    router.push("/");
    return null;
  }

  return (
    <MainLayout mode={mode} user={user} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:account-group" className="w-6 h-6 text-white" />
            </div>
            Customer Management
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Manage your customers here.
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
              data={customers}
              columns={[
                { Header: "Name", accessor: "name", sortable: true },
                { Header: "Email", accessor: "email", sortable: true },
                { Header: "Phone", accessor: "phone", sortable: true },
                { Header: "Address", accessor: "address", sortable: true },
                { Header: "Image", accessor: "image_url", render: (row) => (
                  row.image_url ? (
                    <Image src={row.image_url} alt={row.name || "Profile"} width={40} height={40} className="w-10 h-10 rounded-full object-cover border" />
                  ) : (
                    <span className="inline-block w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <Icon icon="mdi:account-circle" className="w-6 h-6" />
                    </span>
                  )
                ) },
                { Header: "Status", accessor: "is_active", sortable: true, render: (row) => (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                ) },
              ]}
              onEdit={openEditModal}
              onDelete={openConfirm}
              onAddNew={openAddModal}
              addNewLabel="Add New Customer"
            />
          </div>

                      <AddEditModal
              isOpen={showModal}
              type="customers"
              mode={mode}
              item={editItem}
              categories={[]}
              onClose={closeModal}
              onSave={async (values) => {
                try {
                  if (!editItem) {
                    await handleAddCustomer(values);
                    toast.success("Customer added!");
                    closeModal();
                  } else {
                    await handleUpdateCustomer(editItem.id, values);
                    toast.success("Customer updated!");
                    closeModal();
                  }
                } catch (err) {
                  toast.error(err.message || "Failed to save customer");
                }
                              }}
              />
          {errorModal.open && (
            <SimpleModal
              isOpen={true}
              onClose={() => setErrorModal({ open: false, message: "" })}
              title="Duplicate Customer"
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
                  Are you sure you want to delete {" "}
                  <span className="font-semibold">{deleteItem?.name}</span>?
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
    </MainLayout>
  );
} 