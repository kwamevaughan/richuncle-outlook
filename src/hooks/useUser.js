import { useContext } from "react";
import { AuthContext } from "@/context/authContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export const useUser = () => {
  const { user, loading } = useContext(AuthContext);
  return {
    user,
    loading,
    LoadingComponent: <LoadingSpinner />,
  };
};
