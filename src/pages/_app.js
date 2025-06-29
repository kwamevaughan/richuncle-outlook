import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import "../styles/globals.css";
import { sidebarNav } from "@/data/nav";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/context/authContext";

const nunito = Nunito({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

function MyApp({ Component, pageProps }) {
  const [mode, setMode] = useState("light");
  const router = useRouter();

  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mode", newMode);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedMode = window.localStorage.getItem("mode");
    if (savedMode) {
      setMode(savedMode);
    } else {
      const systemMode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setMode(systemMode);
      window.localStorage.setItem("mode", systemMode);
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
    const routeChangeStart = (url) => {
      const pageSlug = url.split("/").pop() || "overview";
      const navItems = sidebarNav.flatMap((category) => category.items);
      const page = navItems.find(
        (item) => item.href === url || item.href.endsWith(`/${pageSlug}`)
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
    const navItems = sidebarNav.flatMap((category) => category.items);
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
    const navItems = sidebarNav.flatMap((category) => category.items);

    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const navItem = navItems.find(
        (item) => item.href === currentPath || item.href.endsWith(`/${segment}`)
      );
      const label = navItem
        ? navItem.label
        : segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ href: currentPath, label });
    });

    return crumbs;
  })();

  return (
    <div className={`${mode === "dark" ? "dark" : ""} ${nunito.variable} font-sans`}>
      <Toaster position="top-center" reverseOrder={false} />
        <AuthProvider>
          <Component
            {...pageProps}
            mode={mode}
            toggleMode={toggleMode}
            breadcrumbs={breadcrumbs}
          />

        </AuthProvider>
    </div>
  );
}

export default MyApp;
