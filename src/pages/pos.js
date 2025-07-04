import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PosHeader from "@/layouts/posHeader";
import { useState } from "react";
import PosProductList from "@/components/PosProductList";
import PosOrderList from "@/components/PosOrderList";

export default function POS({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const [selectedTab, setSelectedTab] = useState("overview");

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
      <div className="flex gap-8 flex-1 min-h-0">
        <PosProductList user={user} />
        <PosOrderList />
      </div>
    </MainLayout>
  );
}
