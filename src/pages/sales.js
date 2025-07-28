import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import SalesTable from "../components/SalesTable";
import SaleDetailsModal from "../components/SaleDetailsModal";
import ExportModal from "../components/export/ExportModal";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useRouter } from "next/router";

export default function SalesPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch("/api/orders")
      .then((res) => res.json())
      .then(({ data, error }) => {
        if (error) throw new Error(error);
        setSales(data || []);
      })
      .catch((err) => setError(err.message || "Failed to load sales"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && sales.length > 0 && router.query.saleId) {
      const sale = sales.find(s => String(s.id) === String(router.query.saleId));
      if (sale) {
        setSelectedSale(sale);
        setShowDetails(true);
      }
    }
  }, [loading, sales, router.query.saleId]);

  // Flatten sales data for export to prevent nested object errors
  const flattenedSales = sales.map(sale => ({
    id: String(sale.id || ''),
    sale_number: String(sale.sale_number || sale.id || ''),
    timestamp: String(sale.timestamp || ''),
    customer_name: String(sale.customer_name || 'Walk In Customer'),
    customer_email: String(sale.customer_email || ''),
    customer_phone: String(sale.customer_phone || ''),
    total: String(sale.total || '0'),
    subtotal: String(sale.subtotal || sale.total || '0'),
    tax: String(sale.tax || '0'),
    discount: String(sale.discount || '0'),
    status: String(sale.status || ''),
    payment_method: String(sale.payment_method || ''),
    payment_receiver_name: String(sale.payment_receiver_name || ''),
    // Flatten payment data if it exists
    payment_amount: sale.payment_data?.amount ? String(sale.payment_data.amount) : '',
    payment_change: sale.payment_data?.change ? String(sale.payment_data.change) : '',
    payment_reference: sale.payment_data?.reference ? String(sale.payment_data.reference) : '',
    payment_success: sale.payment_data?.success ? String(sale.payment_data.success) : '',
    created_at: String(sale.created_at || ''),
    updated_at: String(sale.updated_at || '')
  }));

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
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <Icon
                icon="mdi:bullhorn-outline"
                className="w-5 h-5 sm:w-7 sm:h-7 text-blue-900"
              />
              Sales
            </h1>
            <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between">
              <span>View and manage all sales here. Use the POS to create a new sale.</span>
              <button
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto"
                onClick={() => router.push("/pos")}
              >
                <Icon icon="mdi:plus" className="inline-block mr-1 sm:mr-2" /> New Sale
                (POS)
              </button>
            </div>

            <SalesTable
              sales={sales}
              loading={loading}
              error={error}
              onViewDetails={(sale) => {
                setSelectedSale(sale);
                setShowDetails(true);
              }}
              onExport={() => setShowExportModal(true)}
            />
            <SaleDetailsModal
              sale={selectedSale}
              isOpen={showDetails}
              onClose={() => setShowDetails(false)}
              mode={mode}
            />
            <ExportModal
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              users={flattenedSales}
              mode={mode}
              type="sales"
              title="Export Sales Data"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 