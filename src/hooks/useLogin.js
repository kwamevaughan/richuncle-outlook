import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const useLogin = () => {
  const { login, signInWithSocial, resetPassword } = useAuth(); // Add resetPassword
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(loginData.email, loginData.password, loginData.rememberMe);
  };

  const handleSocialLogin = async (provider) => {
    await signInWithSocial(provider);
  };

  const handleForgotPassword = async (email) => {
    const toastId = toast.loading("Sending password reset email...");
    try {
      await resetPassword(email);
      toast.dismiss(toastId);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error.message || "Failed to send reset email. Please try again."
      );
    }
  };

  return {
    loginData,
    setLoginData,
    showPassword,
    togglePasswordVisibility,
    handleLogin,
    handleLoginChange,
    handleSocialLogin,
    showForgotPasswordModal,
    setShowForgotPasswordModal,
    handleForgotPassword,
  };
};

export default useLogin;
