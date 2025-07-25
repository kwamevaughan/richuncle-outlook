import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import ZReportView from "@/components/ZReportView";
import { Icon } from "@iconify/react";

export default function ZReportPage({ mode = "light", toggleMode, ...props }) {
  const router = useRouter();
  const { id } = router.query;
  const [zReport, setZReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/cash-register-sessions/${id}/z-report`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setZReport(res.data);
        else setError(res.error || "Failed to fetch Z-Report");
      })
      .catch(() => setError("Failed to fetch Z-Report"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout mode={mode} toggleMode={toggleMode} {...props}>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Icon icon="material-symbols:receipt-long" className="w-7 h-7 text-green-700" />
          Z-Report
        </h1>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <ZReportView zReport={zReport} onPrint={handlePrint} showPrintButton={true} />
        )}
      </div>
    </MainLayout>
  );
} 