import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PosHeader from "@/layouts/posHeader";

export default function POS({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

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
        <div className="pt-40 ">
          <p>Testing page</p>
        </div>
    </MainLayout>
  );
}
