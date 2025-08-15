import React, { createContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import SessionExpiredModal from "@/components/modals/SessionExpiredModal";
import LoginErrorModal from "@/components/modals/LoginErrorModal";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skipRedirect, setSkipRedirect] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const initializeAuth = async () => {
    if (isAuthenticating || router.pathname === "/auth/callback") return;
    setIsAuthenticating(true);

    try {
      const cachedUser = localStorage.getItem("ruo_user_data");
      const sessionExpiry = localStorage.getItem("ruo_session_expiry");
      
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        
        // Check if user data is valid
        if (!parsedUser.name) {
          localStorage.removeItem("ruo_user_data");
          localStorage.removeItem("ruo_member_session");
          localStorage.removeItem("user_email");
          localStorage.removeItem("ruo_session_expiry");
        } else {
          // Check session expiry if "Remember Me" was used
          if (sessionExpiry) {
            const expiryTime = parseInt(sessionExpiry);
            const currentTime = Date.now();
            
            if (currentTime > expiryTime) {
              // Session has expired
              console.log("AuthContext: Session expired, logging out");
              localStorage.removeItem("ruo_user_data");
              localStorage.removeItem("ruo_member_session");
              localStorage.removeItem("user_email");
              localStorage.removeItem("ruo_session_expiry");
              localStorage.removeItem("ruo_remembered_email");
              setUser(null);
              setShowExpiredModal(true);
              setLoading(false);
              setIsAuthenticating(false);
              return;
            }
          } else {
            // No session expiry set, check if browser session should persist
            // If no "Remember Me", session should expire when browser closes
            // We can't detect browser close, but we can set a shorter session
            const sessionStart = localStorage.getItem("ruo_session_start");
            if (!sessionStart) {
              // Set session start time for new sessions
              localStorage.setItem("ruo_session_start", Date.now().toString());
            } else {
              // Check if session is older than 8 hours (browser session timeout)
              const sessionAge = Date.now() - parseInt(sessionStart);
              const maxSessionAge = 8 * 60 * 60 * 1000; // 8 hours
              
              if (sessionAge > maxSessionAge) {
                console.log("AuthContext: Browser session expired, logging out");
                localStorage.removeItem("ruo_user_data");
                localStorage.removeItem("ruo_member_session");
                localStorage.removeItem("user_email");
                localStorage.removeItem("ruo_session_start");
                setUser(null);
                setShowExpiredModal(true);
                setLoading(false);
                setIsAuthenticating(false);
                return;
              }
            }
          }
          
          setUser(parsedUser);
          setLoading(false);
          setIsAuthenticating(false);
          return;
        }
      }

      // No cached user, user is not authenticated
      setUser(null);
      localStorage.removeItem("ruo_user_data");
      localStorage.removeItem("ruo_member_session");
      localStorage.removeItem("user_email");
      localStorage.removeItem("ruo_session_expiry");
      localStorage.removeItem("ruo_session_start");
    } catch (err) {
      console.error("AuthContext: Initialization error:", err);
      setLoginError("An error occurred during authentication.");
      setUser(null);
      localStorage.removeItem("ruo_user_data");
      localStorage.removeItem("ruo_member_session");
      localStorage.removeItem("user_email");
      localStorage.removeItem("ruo_session_expiry");
      localStorage.removeItem("ruo_session_start");
    } finally {
      setLoading(false);
      setIsAuthenticating(false);
    }
  };

  const debouncedInitializeAuth = debounce(initializeAuth, 500);

  useEffect(() => {
    initializeAuth();
    
    // Set up periodic session validation (every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      const sessionExpiry = localStorage.getItem("ruo_session_expiry");
      const sessionStart = localStorage.getItem("ruo_session_start");
      const currentTime = Date.now();
      
      // Check "Remember Me" session expiry
      if (sessionExpiry && currentTime > parseInt(sessionExpiry)) {
        console.log("AuthContext: Periodic check - Session expired");
        logout();
        return;
      }
      
      // Check browser session expiry (8 hours)
      if (sessionStart && !sessionExpiry) {
        const sessionAge = currentTime - parseInt(sessionStart);
        const maxSessionAge = 8 * 60 * 60 * 1000; // 8 hours
        
        if (sessionAge > maxSessionAge) {
          console.log("AuthContext: Periodic check - Browser session expired");
          logout();
          return;
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const login = async (email, password, rememberMe, recaptchaToken) => {
    try {
      // Use our custom login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("AuthContext: Login API error:", result.error);
        setLoginError(
          "Invalid email or password. If you recently received a new password, please use it or contact support at kwamevaughan@gmail.com."
        );
        throw new Error(result.error || "Login failed");
      }

      const userData = result.user;
      console.log("[LOGIN] User data from API:", userData);

      if (rememberMe) {
        localStorage.setItem("ruo_remembered_email", email);
        localStorage.setItem(
          "ruo_session_expiry",
          (Date.now() + 30 * 24 * 60 * 60 * 1000).toString()
        );
        localStorage.removeItem("ruo_session_start"); // Remove browser session timer
      } else {
        localStorage.removeItem("ruo_remembered_email");
        localStorage.removeItem("ruo_session_expiry");
        localStorage.setItem("ruo_session_start", Date.now().toString()); // Set browser session timer
      }

      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.full_name,
        role: userData.role,
        avatar_url: userData.avatar_url,
        avatar_file_id: userData.avatar_file_id,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        last_login: userData.last_login,
        store_id: userData.store_id,
      };

      setUser(user);
      localStorage.setItem("ruo_user_data", JSON.stringify(user));
      localStorage.setItem("ruo_member_session", "authenticated");
      localStorage.setItem("user_email", email);
      console.log(
        "AuthContext: User authenticated, navigating to appropriate page:",
        user
      );
      
      // Set flag to indicate user just logged in
      sessionStorage.setItem('just_logged_in', 'true');
      
      toast.success("Login successful! Redirecting...");
      
      if (user.role === 'cashier') {
        await router.push('/pos');
      } else {
        // For admins and managers, redirect to dashboard
        await router.push('/dashboard');
      }
      
      // Clear the flag after a short delay
      setTimeout(() => {
        sessionStorage.removeItem('just_logged_in');
      }, 2000);
      
      toast.dismiss("route-loading");
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      throw error;
    }
  };

  const signInWithSocial = async (provider) => {
    try {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? process.env.NEXT_PUBLIC_BASE_URL_DEV
          : process.env.NEXT_PUBLIC_BASE_URL_PROD;
      const redirectTo = `${baseUrl}/auth/callback`;
      console.log(
        `AuthContext: Initiating ${provider} login with redirectTo: ${redirectTo}`
      );
      
      // Use API for social login
      const response = await fetch("/api/auth/social-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          provider: provider.toLowerCase(),
          redirectTo 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(
          `AuthContext: Social login error with ${provider}:`,
          error
        );
        setLoginError(`Failed to sign in with ${provider}. Please try again.`);
        throw new Error(`Failed to sign in with ${provider}`);
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("AuthContext: Social login error:", error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setLoginError("Failed to send reset email. Please try again.");
        throw new Error(error || "Failed to send reset email");
      }

      localStorage.setItem("reset_email", email);
      toast.success("Password reset email sent. Check your inbox.");
    } catch (error) {
      console.error("AuthContext: Password reset error:", error);
      setLoginError(error.message || "Failed to send reset email.");
      throw error;
    }
  };

  useEffect(() => {
    const handleSocialLoginCallback = async () => {
      if (router.pathname !== "/auth/callback") return;

      console.log("AuthContext: Handling social login callback");

      try {
        // Use API to get session info
        const response = await fetch("/api/auth/session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("AuthContext: Error retrieving session");
          router.push("/");
          return;
        }

        const { session } = await response.json();

        if (session?.user) {
          const { user } = session;
          const email = user.email;
          const authUserId = user.id;
          const name =
            user.user_metadata.full_name || user.user_metadata.name || "User";

          console.log("AuthContext: Social login user:", {
            email,
            authUserId,
            name,
          });

          // Check if user exists via API
          const userResponse = await fetch(`/api/users/${authUserId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!userResponse.ok) {
            console.log(
              "AuthContext: No existing candidate, redirecting to membership page"
            );
            toast.error("No account found. Redirecting to Membership page.");
            setSkipRedirect(true);
            console.log(
              "AuthContext: Calling /api/signout with authUserId:",
              authUserId
            );
            const signoutResponse = await fetch("/api/signout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                redirectTo: "https://richuncleoutlook.com/",
                authUserId,
              }),
            });

            if (!signoutResponse.ok) {
              console.error(
                "AuthContext: Sign-out error:",
                await signoutResponse.json()
              );
              window.location.assign("https://richuncleoutlook.com/");
              return;
            }

            const { redirectTo } = await signoutResponse.json();
            console.log("AuthContext: Redirecting to:", redirectTo);
            window.location.assign(redirectTo);
            return;
          }

          const existingUser = await userResponse.json();

          // Update last login timestamp
          try {
            await fetch("/api/auth/update-last-login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: existingUser.id }),
            });
          } catch (error) {
            console.error("Failed to update last login:", error);
          }

          localStorage.setItem("ruo_member_session", "authenticated");
          localStorage.setItem("user_email", email);

          setUser({
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.full_name,
            role: existingUser.role,
            avatar_url: existingUser.avatar_url,
            is_active: existingUser.is_active,
            created_at: existingUser.created_at,
            updated_at: existingUser.updated_at,
            store_id: existingUser.store_id,
          });

          console.log(
            "AuthContext: Social login successful, navigating to appropriate page"
          );
          
          // Set flag to indicate user just logged in
          sessionStorage.setItem('just_logged_in', 'true');
          
          toast.success("Login successful! Redirecting...");
          
          if (existingUser.role === 'cashier') {
            await router.push('/pos');
          } else {
            await router.push('/dashboard');
          }
          
          // Clear the flag after a short delay
          setTimeout(() => {
            sessionStorage.removeItem('just_logged_in');
          }, 2000);
          
          toast.dismiss("route-loading");
        } else {
          console.log("AuthContext: No session user, redirecting to login");
          router.push("/");
        }
      } catch (error) {
        console.error("AuthContext: Social login callback error:", error);
        router.push("/");
      }
    };

    handleSocialLoginCallback();
  }, [router]);

  const logout = async () => {
    console.log("AuthContext: Logging out...");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("AuthContext: Sign-out error");
        toast.error("Failed to log out. Please try again.");
        return;
      }

      setUser(null);
      localStorage.removeItem("ruo_user_data");
      localStorage.removeItem("ruo_member_session");
      localStorage.removeItem("user_email");
      localStorage.removeItem("ruo_remembered_email");
      localStorage.removeItem("ruo_session_expiry");
      localStorage.removeItem("ruo_session_start");
      await router.push("/");
    } catch (err) {
      console.error("AuthContext: Logout error:", err);
      toast.error("An error occurred during logout. Please try again.");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, signInWithSocial, resetPassword }}
    >
      {children}
      <SessionExpiredModal
        isOpen={showExpiredModal}
        onClose={() => {
          setShowExpiredModal(false);
          localStorage.removeItem("ruo_user_data");
          localStorage.removeItem("ruo_member_session");
          localStorage.removeItem("user_email");
          router.push("/");
        }}
      />
      <LoginErrorModal
        isOpen={!!loginError}
        onClose={() => setLoginError(null)}
        errorMessage={loginError}
      />
    </AuthContext.Provider>
  );
};
