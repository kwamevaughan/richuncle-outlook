import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PosHeader from "@/layouts/posHeader";
import { useState, useEffect } from "react";
import PosProductList from "@/components/PosProductList";
import PosOrderList from "@/components/PosOrderList";
import { Icon } from "@iconify/react";
import PosFooterActions from "@/components/PosFooterActions";
import { supabaseClient } from "../lib/supabase";

export default function POS({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  useEffect(() => {
    async function fetchDiscounts() {
      const { data, error } = await supabaseClient
        .from("discounts")
        .select("*")
        .eq("is_active", true);
      if (!error) setDiscounts(data || []);
    }
    fetchDiscounts();
  }, []);

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
      HeaderComponent={PosHeader}
      showSidebar={false}
      {...props}
    >
      <div className="flex gap-8 flex-1 min-h-0 overflow-hidden">
        <PosProductList
          user={user}
          className="flex-1 min-h-0 overflow-auto"
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          quantities={quantities}
          setQuantities={setQuantities}
          setProducts={setProducts}
        />
        <PosOrderList
          className="flex-1 min-h-0 overflow-auto"
          selectedProducts={selectedProducts}
          quantities={quantities}
          products={products}
          setSelectedProducts={setSelectedProducts}
          setQuantities={setQuantities}
          discounts={discounts}
        />
      </div>
      <PosFooterActions />
    </MainLayout>
  );
}
