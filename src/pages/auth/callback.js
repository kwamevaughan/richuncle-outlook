import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabaseClient } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log("[AuthCallback] Starting callback handling");

        // Handle the auth callback first
        const { data, error } = await supabaseClient.auth.getSession();
        console.log(
          "[AuthCallback] Session:",
          data?.session?.user?.email,
          error?.message
        );

        if (error) {
          console.error("[AuthCallback] Session error:", error);
          throw error;
        }

        if (data.session) {
          console.log("[AuthCallback] Session found:", data.session.user.email);

          // Verify user exists in users table
          const authUserId = data.session.user.id;
          const { data: userData, error: userError } = await supabaseClient
            .from("users")
            .select("id, email, full_name, role, avatar_url, is_active, created_at, updated_at")
            .eq("id", authUserId)
            .single();

          if (userError || !userData) {
            console.error(
              "[AuthCallback] User not found in users:",
              userError
            );
            toast.error(
              "No account found for this email. Please ensure your account is activated or contact support.",
              { duration: 4000 }
            );
            await supabaseClient.auth.signOut();
            await router.push("/?auth=error");
            return;
          }

          console.log(
            "[AuthCallback] User data found:",
            userData.email
          );

          // Set localStorage items that AuthContext expects
          localStorage.setItem("ruo_member_session", "authenticated");
          localStorage.setItem("user_email", userData.email);

          // Wait a moment for cookies to be properly set by Supabase
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Check if cookies are properly set
          const cookieExists = document.cookie.includes(
            "sb-kswioogssarubigcpzez-auth-token"
          );
          console.log("[AuthCallback] Auth cookie exists:", cookieExists);

          if (!cookieExists) {
            console.warn(
              "[AuthCallback] Auth cookie not found, forcing a refresh"
            );
            // Try to refresh the session to ensure cookies are set
            const { data: refreshData, error: refreshError } =
              await supabaseClient.auth.refreshSession();
            if (refreshData?.session) {
              console.log("[AuthCallback] Session refreshed successfully");
              await new Promise((resolve) => setTimeout(resolve, 500));
            } else {
              console.error(
                "[AuthCallback] Session refresh failed:",
                refreshError
              );
            }
          }

          console.log("[AuthCallback] Redirecting to dashboard");

          // Use window.location instead of router for a full page reload
          // This ensures the server-side props run with fresh cookies
          window.location.href = "/dashboard";
        } else {
          console.error("[AuthCallback] No session found");
          toast.error("Authentication failed. Please try again.", {
            duration: 3000,
          });
          await router.push("/?auth=error");
        }
      } catch (err) {
        console.error("[AuthCallback] Error:", err);
        toast.error("Authentication error. Please try again.", {
          duration: 3000,
        });
        await router.push("/?auth=error");
      } finally {
        setIsProcessing(false);
      }
    }

    // Only run if we're actually on the callback page and router is ready
    if (router.isReady) {
      handleCallback();
    }
  }, [router, router.isReady]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we redirect you...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
