import { useContext } from "react";
import { AuthContext } from "@/context/authContext";
import toast from "react-hot-toast";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { login, logout, signInWithSocial, resetPassword } = context;

  const handleLogin = async (email, password, rememberMe) => {
    const toastId = toast.loading("Please wait...");
    try {
      await login(email, password, rememberMe);
      toast.dismiss(toastId);
      toast.success("Login successful! Redirecting...");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  const handleSocialLogin = async (provider) => {
    const toastId = toast.loading(`Signing in with ${provider}...`);
    try {
      await signInWithSocial(provider);
      toast.dismiss(toastId);
      // Toast handled in AuthContext after redirect
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  return {
    login: handleLogin,
    logout,
    signInWithSocial: handleSocialLogin,
    resetPassword: handleResetPassword,
  };
};
