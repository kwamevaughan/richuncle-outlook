import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import SalesTable from "../components/SalesTable";
import SaleDetailsModal from "../components/SaleDetailsModal";
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
              <Icon icon="mdi:bullhorn-outline" className="w-7 h-7 text-blue-900" />
              Sales
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              View and manage all sales here. Use the POS to create a new sale.
            </p>
            <div className="flex justify-end mb-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => router.push("/pos")}
              >
                <Icon icon="mdi:plus" className="inline-block mr-2" /> New Sale (POS)
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
            />
            <SaleDetailsModal
              sale={selectedSale}
              isOpen={showDetails}
              onClose={() => setShowDetails(false)}
              mode={mode}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 