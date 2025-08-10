import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import ReCAPTCHA from "react-google-recaptcha";
import useLogin from "@/hooks/useLogin";
import SimpleModal from "@/components/SimpleModal";

const LoginPage = ({ mode = "light", toggleMode }) => {
  const router = useRouter();
  const {
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
  } = useLogin();
  const currentYear = new Date().getFullYear();
  const recaptchaRef = useRef(null);

  // Remove per-page cashier redirect logic
  // (No need for useEffect that redirects cashiers to /pos)

  return (
    <div
      className={`flex flex-col md:flex-row min-h-screen ${
        mode === "dark" ? "bg-gray-900" : "bg-login"
      } pt-0`}
    >
      <div
        className={`w-full md:w-2/5 flex flex-col justify-between overflow-y-auto gap-10 ${
          mode === "dark"
            ? "bg-gray-800/70 backdrop-blur-lg border border-gray-700/30 shadow-xl"
            : "bg-white/70 backdrop-blur-lg border border-white/30 shadow-xl"
        }`}
      >
        <div className="flex-grow flex flex-col justify-center items-center">
          <div className="w-full max-w-md">
            <div
              className={`py-4 px-4 mb-4 shadow-lg hover:shadow-none transition-all duration-500 rounded-lg ${
                mode === "dark" ? "bg-gray-700/80" : "bg-white/80"
              }`}
            >
              <p
                className={`text-4xl font-black text-center ${
                  mode === "dark" ? "text-white" : "text-blue-900"
                }`}
              >
                RichUncle Outlook
              </p>
            </div>
          </div>

          <div className="w-full max-w-md py-4">
            <div className="pb-6 space-y-2">
              <p
                className={`text-3xl font-bold ${
                  mode === "dark" ? "text-blue-300" : "text-blue-800"
                }`}
              >
                Welcome back!
              </p>
              <p
                className={mode === "dark" ? "text-gray-300" : "text-blue-900"}
              >
                Access the store dashboard using your email and password.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-8">
                <label className="hidden" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={loginData.email}
                    placeholder="Enter your email"
                    onChange={handleLoginChange}
                    className={`w-full rounded-lg py-2.5 md:py-3 px-2 focus:outline-none focus:border-blue-500 ${
                      mode === "dark"
                        ? "bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600"
                        : "bg-white/80 text-blue-950 border border-gray-300"
                    }`}
                  />
                  <span
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      mode === "dark" ? "text-gray-400" : "text-blue-950"
                    }`}
                  >
                    <Icon icon="heroicons:envelope" className="w-5 h-5" />
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <label className="hidden" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    placeholder="Enter your password"
                    onChange={handleLoginChange}
                    className={`w-full rounded-lg py-2.5 md:py-3 px-2 focus:outline-none focus:border-blue-500 ${
                      mode === "dark"
                        ? "bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600"
                        : "bg-white/80 text-blue-950 border border-gray-300"
                    }`}
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${
                      mode === "dark" ? "text-gray-400" : "text-blue-950"
                    }`}
                  >
                    {showPassword ? (
                      <Icon icon="heroicons:eye-slash" className="w-5 h-5" />
                    ) : (
                      <Icon icon="heroicons:eye" className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-col items-center">
                  <p
                    className={`text-xs mb-2 text-center ${
                      mode === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Please verify that you're not a robot
                  </p>
                  <div
                    className={`transition-opacity duration-300 ${
                      recaptchaToken ? "opacity-100" : "opacity-90"
                    }`}
                  >
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      onChange={handleRecaptchaChange}
                      onExpired={handleRecaptchaExpired}
                      onError={handleRecaptchaError}
                      theme={mode === "dark" ? "dark" : "light"}
                      size="normal"
                      onLoad={() =>
                        console.log("reCAPTCHA loaded successfully")
                      }
                    />
                  </div>
                  {!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                    <p className="text-xs text-red-500 mt-2">
                      reCAPTCHA configuration error. Please contact support.
                    </p>
                  )}
                  {recaptchaToken && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <Icon
                        icon="solar:check-circle-bold"
                        className="w-3 h-3"
                      />
                      Verification complete
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-2 md:space-y-0">
                <div className="flex items-center">
                  <div
                    onClick={() =>
                      setLoginData((prev) => ({
                        ...prev,
                        rememberMe: !prev.rememberMe,
                      }))
                    }
                    className={`w-5 h-5 flex items-center justify-center border-2 rounded-full cursor-pointer transition-all duration-200 ease-in-out ${
                      mode === "dark" ? "border-gray-400" : "border-blue-950"
                    } ${
                      loginData.rememberMe ? "bg-transparent" : "bg-transparent"
                    }`}
                  >
                    {loginData.rememberMe && (
                      <Icon
                        icon="ic:baseline-check"
                        className={`w-4 h-4 ${
                          mode === "dark" ? "text-gray-400" : "text-blue-950"
                        }`}
                      />
                    )}
                  </div>

                  <label
                    className={`ml-2 font-light text-sm md:text-base cursor-pointer ${
                      mode === "dark" ? "text-gray-300" : "text-blue-950"
                    }`}
                    onClick={() =>
                      setLoginData((prev) => ({
                        ...prev,
                        rememberMe: !prev.rememberMe,
                      }))
                    }
                  >
                    Remember me on this device
                  </label>
                </div>

                <span>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className={`font-light text-sm md:text-base hover:underline ${
                      mode === "dark"
                        ? "text-blue-300 hover:text-red-400"
                        : "text-blue-950 hover:text-red-600"
                    }`}
                  >
                    Forgot Password?
                  </button>
                </span>
              </div>

              <button
                type="submit"
                disabled={isRecaptchaLoading || !recaptchaToken}
                className={`w-full font-bold py-3 rounded-full transform transition-transform duration-700 ease-in-out hover:scale-105 ${
                  mode === "dark"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-900 text-white hover:bg-blue-800"
                } ${
                  isRecaptchaLoading || !recaptchaToken
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isRecaptchaLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Icon
                      icon="solar:loading-bold"
                      className="w-5 h-5 animate-spin"
                    />
                    Verifying...
                  </div>
                ) : (
                  "Access Dashboard"
                )}
              </button>
            </form>

            {/* <div className="flex flex-col justify-center items-center gap-4 md:flex-row md:gap-6 mt-6">
              <button
                onClick={() => handleSocialLogin("Google")}
                className="flex items-center hover:underline text-gray-600 font-normal py-2 rounded-lg transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px]"
              >
                <Icon icon="devicon:google" className="w-5 h-5 mr-2" />
                Continue with Google
              </button>
              <button
                onClick={() => handleSocialLogin("Facebook")}
                className="flex items-center hover:underline text-gray-600 font-normal py-2 rounded-lg transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px]"
              >
                <Icon icon="logos:facebook" className="w-5 h-5 mr-2" />
                Continue with Facebook
              </button>
            </div> */}
          </div>
          <span className={mode === "dark" ? "text-gray-400" : "text-gray-600"}>
            Copyright © {currentYear}, All rights reserved.
          </span>
        </div>
      </div>

      <div
        className={`hidden md:block w-full md:w-3/5 ${
          mode === "dark" ? "bg-gray-800/10" : "bg-blue-950/10"
        }`}
      ></div>

      <SimpleModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        title="Reset Password"
        mode={mode}
        width="max-w-md"
      >
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
          <label
            htmlFor="reset-email"
            className={`text-sm font-medium ${
              mode === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Enter your email address to reset your password:
          </label>
          <input
            id="reset-email"
            name="reset-email"
            type="email"
            required
            placeholder="Email address"
            className={`w-full rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 border ${
              mode === "dark"
                ? "bg-gray-700 text-gray-100 placeholder-gray-400 border-gray-600"
                : "bg-white/80 text-blue-950 border-gray-200"
            }`}
            value={loginData.email}
            onChange={handleLoginChange}
          />
          <button
            type="submit"
            className={`w-full font-bold py-2 rounded-lg mt-2 transition-all duration-200 ${
              mode === "dark"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-900 text-white hover:bg-blue-800"
            }`}
          >
            Send Reset Link
          </button>
        </form>
      </SimpleModal>
    </div>
  );
};

export default LoginPage;
