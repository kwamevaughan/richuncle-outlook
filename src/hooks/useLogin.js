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
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isRecaptchaLoading, setIsRecaptchaLoading] = useState(false);

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

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
    toast.error("reCAPTCHA expired. Please verify again.");
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken(null);
    toast.error("reCAPTCHA error. Please try again.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification.");
      return;
    }
    
    setIsRecaptchaLoading(true);
    try {
      await login(loginData.email, loginData.password, loginData.rememberMe, recaptchaToken);
    } catch (error) {
      // Reset reCAPTCHA on login failure
      setRecaptchaToken(null);
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
    } finally {
      setIsRecaptchaLoading(false);
    }
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
    recaptchaToken,
    isRecaptchaLoading,
    handleLogin,
    handleLoginChange,
    handleRecaptchaChange,
    handleRecaptchaExpired,
    handleRecaptchaError,
    handleSocialLogin,
    showForgotPasswordModal,
    setShowForgotPasswordModal,
    handleForgotPassword,
  };
};

export default useLogin;
