import { useContext } from "react";
import { AuthContext } from "@/context/authContext";

const useLogout = () => {
  const { logout } = useContext(AuthContext);

  // No need to handle the session and redirect manually here
  const handleLogout = () => {
    logout(); // Call logout function from AuthContext
  };

  return { handleLogout };
};

export default useLogout;
