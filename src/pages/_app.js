import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import "../styles/globals.css";
import "../styles/dark-mode.css";
import { sidebarNav } from "@/data/nav";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/context/authContext";
import useSidebar from "@/hooks/useSidebar";
import { DarkModeProvider } from "@/components/GlobalDarkMode";
import "../styles/dark-mode-date-range.css";

const nunito = Nunito({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

function MyApp({ Component, pageProps }) {
  const [mode, setMode] = useState("light");
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();

  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mode", newMode);
      // Toggle the dark class on the document
      if (newMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedMode = window.localStorage.getItem("mode");
    if (savedMode) {
      setMode(savedMode);
      // Apply the saved mode to the document
      if (savedMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      const systemMode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setMode(systemMode);
      window.localStorage.setItem("mode", systemMode);
      // Apply the system mode to the document
      if (systemMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const systemMode = e.matches ? "dark" : "light";
      if (!window.localStorage.getItem("mode")) {
        setMode(systemMode);
      }
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Add global error handler for DOM manipulation errors
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleError = (event) => {
      if (event.error && event.error.message && event.error.message.includes('insertBefore')) {
        console.warn('Global error handler caught DOM manipulation error:', event.error);
        event.preventDefault();
        // Optionally show a user-friendly message
        toast.error('A display error occurred. Please refresh the page if the issue persists.', {
          duration: 5000,
        });
      }
    };

    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('insertBefore')) {
        console.warn('Global error handler caught unhandled DOM manipulation error:', event.reason);
        event.preventDefault();
        // Optionally show a user-friendly message
        toast.error('A display error occurred. Please refresh the page if the issue persists.', {
          duration: 5000,
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function handleLayaways() {
      if (router.pathname !== "/pos") {
        router.push({ pathname: "/pos", query: { open: "layaways" } });
      } else {
        window.dispatchEvent(new CustomEvent("open-retrieve-layaways-modal"));
      }
    }
    function handleOrders() {
      if (router.pathname !== "/pos") {
        router.push({ pathname: "/pos", query: { open: "orders" } });
      } else {
        window.dispatchEvent(new CustomEvent("open-retrieve-orders-modal"));
      }
    }
    window.addEventListener("open-retrieve-layaways-modal", handleLayaways);
    window.addEventListener("open-retrieve-orders-modal", handleOrders);
    return () => {
      window.removeEventListener("open-retrieve-layaways-modal", handleLayaways);
      window.removeEventListener("open-retrieve-orders-modal", handleOrders);
    };
  }, [router]);

  useEffect(() => {
    const routeChangeStart = (url) => {
      const pageSlug = url.split("/").pop() || "overview";
      const navItems = sidebarNav.flatMap((entry) =>
        entry.items ? entry.items : [entry]
      );
      const page = navItems.find(
        (item) => item && item.href && (item.href === url || item.href.endsWith(`/${pageSlug}`))
      );
      const pageName = page
        ? page.label
        : pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1);
      toast.loading(`Fetching ${pageName}...`, {
        id: "route-loading",
        duration: 1000, // Reduced duration for quicker toasts
      });
    };

    const routeChangeComplete = () => {
      toast.dismiss("route-loading");
    };

    const routeChangeError = (err, url) => {
      if (url === "/") {
        toast.dismiss("route-loading");
      } else {
        toast.error("Failed to load page", { id: "route-loading" });
      }
    };

    // Prefetch sidebar routes
    const navItems = sidebarNav.flatMap((entry) =>
      entry.items ? entry.items : [entry]
    );
    navItems.forEach((item) => {
      router.prefetch(item.href);
    });

    router.events.on("routeChangeStart", routeChangeStart);
    router.events.on("routeChangeComplete", routeChangeComplete);
    router.events.on("routeChangeError", routeChangeError);

    return () => {
      router.events.off("routeChangeStart", routeChangeStart);
      router.events.off("routeChangeComplete", routeChangeComplete);
      router.events.off("routeChangeError", routeChangeError);
    };
  }, [router]);

  const breadcrumbs = (() => {
    const path = router.asPath.split("?")[0];
    const segments = path.split("/").filter((s) => s);
    const crumbs = [{ href: "/", label: "Home" }];

    let currentPath = "";
    const navItems = sidebarNav.flatMap((entry) =>
      entry.items ? entry.items : [entry]
    );

    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const navItem = navItems.find(
        (item) => item && item.href && (item.href === currentPath || item.href.endsWith(`/${segment}`))
      );
      const label = navItem
        ? navItem.label
        : segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ href: currentPath, label });
    });

    return crumbs;
  })();

  return (
    <div className={`${mode === "dark" ? "dark" : ""} ${nunito.variable} font-sans flex flex-col min-h-screen`}>
      <Toaster position="top-center" reverseOrder={false} />
        <AuthProvider>
          <DarkModeProvider>
            <main className="flex-1">
              <Component
                {...pageProps}
                mode={mode}
                toggleMode={toggleMode}
                breadcrumbs={breadcrumbs}
                isSidebarOpen={isSidebarOpen}
              />
            </main>
          </DarkModeProvider>
        </AuthProvider>
    </div>
  );
}

export default MyApp;
