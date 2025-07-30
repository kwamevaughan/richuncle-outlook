import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

export default function MessagesPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();
  const [iconKey, setIconKey] = useState(0);
  

  // Force icon to redraw every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIconKey(prev => prev + 1);
    }, 6000);
    
    return () => clearInterval(interval);
  }, []);

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-1 bg-gray-50 min-h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-4 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:view-dashboard"
                        className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                      />
                    </div>
                    Messaging
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Send and receive messages to staff
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6 py-10">
              <div className="flex flex-col items-center justify-center h-full w-full ">
                <div className="mb-2">
                  <Icon
                    key={iconKey}
                    icon="line-md:chat"
                    width="96"
                    height="96"
                    className="text-blue-600"
                    auto="1"                    
                  />
                </div>

                <p className="text-lg text-center max-w-xl mb-8 text-gray-500 dark:text-gray-300">
                  We&apos;re finalizing the Messaging platform to ensure you get
                  the best experience. Please check back soon!
                </p>
                <div className="flex justify-center">
                  <span className="inline-block animate-bounce rounded-full bg-blue-600 h-4 w-4 mr-2"></span>
                  <span
                    className="inline-block animate-bounce rounded-full bg-blue-600 h-4 w-4 mr-2"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="inline-block animate-bounce rounded-full bg-blue-600 h-4 w-4"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            </div>          
          </div>
        </div>
      </div>

      
    </MainLayout>
  );
} 