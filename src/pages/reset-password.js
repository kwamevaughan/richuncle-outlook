import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Extract token and email from URL query
    const { token: urlToken, email: urlEmail } = router.query;
    if (urlToken) {
      setToken(urlToken);
    }
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
    }
  }, [router.query]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword,
          token,
          code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast.success("Password updated successfully!");
      await router.push("/");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-orange-300 rounded-full opacity-15 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="p-3 rounded-2xl flex justify-center">
          <Image
            src="/assets/images/logo.svg"
            alt="Pan-African Agency Network Logo"
            width={240}
            height={0}
            className="transition-all duration-300 ease-in-out hover:scale-105 drop-shadow-lg"
            priority
          />
        </div>
        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo section */}
          <div className="text-center">
            <div className="mb-6 flex justify-center"></div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Create a new secure password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-gray-700"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter your email address"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    icon="mdi:email-outline"
                    className="w-5 h-5 text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-gray-700"
                htmlFor="new-password"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon
                    icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-gray-700"
                htmlFor="confirm-password"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon
                    icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            {/* Code Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="block text-sm font-semibold text-gray-700"
                  htmlFor="code"
                >
                  Confirmation Code
                  <span className="text-gray-400 font-normal ml-1">
                    (Optional if using link)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      toast.error("Please enter your email address");
                      return;
                    }
                    setLoading(true);
                    try {
                      const response = await fetch("/api/reset-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      });
                      if (!response.ok)
                        throw new Error("Failed to resend email");
                      toast.success("Reset email resent. Check your inbox.");
                    } catch (error) {
                      toast.error("Failed to resend email");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Resend Code
                </button>
              </div>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter 6-digit code from email"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    icon="mdi:email-outline"
                    className="w-5 h-5 text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  />
                  Resetting Password...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Icon icon="mdi:lock-reset" className="w-5 h-5 mr-2" />
                  Reset Password
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                href="/"
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <Icon
              icon="mdi:shield-check"
              className="w-4 h-4 text-blue-600 mr-2"
            />
            <span className="text-xs text-blue-700">
              Your password is encrypted and secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
