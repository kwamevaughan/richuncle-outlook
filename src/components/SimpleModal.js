import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";

const SimpleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  mode = "light",
  width = "max-w-2xl",
  rightElement,
  hasUnsavedChanges = false,
  disableOutsideClick = false,
  animationDuration = 300
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const scrollPositionRef = useRef(0);

  // Handle modal open/close with smooth transitions
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (shouldRender) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [shouldRender]);

  // Handle escape key
  useEffect(() => {
      const handleEscape = (e) => {
    if (e.key === 'Escape' && isOpen) {
      if (hasUnsavedChanges) {
        setShowConfirmDialog(true);
      } else {
        onClose();
      }
    }
  };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, hasUnsavedChanges, onClose]);

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleOutsideClick = (e) => {
    if (!disableOutsideClick) {
      if (hasUnsavedChanges) {
        setShowConfirmDialog(true);
      } else {
        onClose();
      }
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };

  if (!shouldRender) return null;

  return (
    <>
      <div
        className="absolute inset-0 h-screen"
        style={{ zIndex: 99999, top: `${scrollPositionRef.current}px` }}
        onClick={handleOutsideClick}
        onTouchMove={(e) => {
          // Prevent touch scrolling on background
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Enhanced Glassmorphic Background */}
        <div
          className={`fixed inset-0 transition-all duration-${animationDuration} ease-out backdrop-blur-sm
            ${
              mode === "dark"
                ? "bg-gradient-to-br from-slate-900/40 via-blue-900/20 to-blue-900/30"
                : "bg-gradient-to-br from-white/40 via-blue-50/40 to-blue-50/30"
            } ${
              isAnimating 
                ? 'opacity-100' 
                : 'opacity-0'
            }`}
          onClick={handleOutsideClick}
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0, 123, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(100, 149, 237, 0.08) 0%, transparent 50%)
            `,
          }}
        />

        {/* Modal Content */}
        <div
          className="flex min-h-screen items-center justify-center p-4"
          onClick={handleOutsideClick}
          onTouchMove={(e) => {
            // Allow touch scrolling within modal but prevent background scrolling
            e.stopPropagation();
          }}
        >
          <div
            className={`relative w-full ${width} transform transition-all duration-${animationDuration} ease-out max-h-[85vh] overflow-hidden
              ${
                isAnimating 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 translate-y-4'
              }
              rounded-3xl shadow-2xl shadow-black/20
              ${
                mode === "dark"
                  ? "bg-gray-900/95 text-white border border-white/10"
                  : "bg-white/95 text-gray-900 border border-white/20"
              } 
              backdrop-blur-xl`}
            style={{
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium Header with Enhanced Gradient */}
            <div
              className={`relative px-8 py-4 overflow-hidden rounded-t-3xl ${
                mode === "dark" ? "bg-gradient-to-r from-blue-600 to-blue-700" : "bg-gradient-to-r from-[#172840] to-blue-600"
              }`}
              style={{
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform -translate-x-16 -translate-y-16 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-lg transform translate-x-12 translate-y-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="relative flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  {title}
                </h2>
                <div className="flex items-center gap-4">
                  {rightElement}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="group p-3 bg-white/20 rounded-2xl transition-all duration-300 hover:bg-white/30 hover:scale-110 active:scale-95 backdrop-blur-sm"
                  >
                    <Icon
                      icon="heroicons:x-mark"
                      className="h-6 w-6 text-white font-bold transition-transform duration-300 group-hover:rotate-90"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area with Enhanced Glass Effect */}
            <div
              className={`p-8 overflow-y-auto max-h-[calc(85vh-140px)] ${
                mode === "dark" ? "bg-gray-900/60" : "bg-white/70"
              }`}
              style={{
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Content wrapper with subtle inner glow */}
              <div
                className={`${
                  mode === "dark" ? "text-gray-100" : "text-gray-800"
                }`}
              >
                {children}
              </div>
            </div>

            {/* Enhanced Border with Gradient */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.3) 0%, 
                    transparent 20%, 
                    transparent 80%, 
                    rgba(255, 255, 255, 0.2) 100%
                  )
                `,
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "xor",
                WebkitMaskComposite: "xor",
                padding: "1px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: 100000 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`fixed inset-0 transition-all duration-${animationDuration} ease-out backdrop-blur-sm
              ${
                mode === "dark"
                  ? "bg-gradient-to-br from-slate-900/50 via-blue-900/30 to-blue-900/40"
                  : "bg-gradient-to-br from-white/50 via-blue-50/50 to-blue-50/40"
              }`}
            onClick={handleCancelClose}
          />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className={`relative w-full max-w-md transform transition-all duration-${animationDuration} ease-out
                rounded-3xl shadow-2xl shadow-black/30
                ${
                  mode === "dark"
                    ? "bg-gray-900/95 text-white border border-white/10"
                    : "bg-white/95 text-gray-900 border border-white/20"
                } 
                backdrop-blur-xl`}
              style={{
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`relative px-8 py-4 overflow-hidden rounded-t-3xl ${
                  mode === "dark" ? "bg-gradient-to-r from-red-600 to-red-700" : "bg-gradient-to-r from-red-500 to-red-600"
                }`}
              >
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Unsaved Changes
                </h2>
              </div>
              <div className={`p-8 ${mode === "dark" ? "" : ""}`}>
                <p
                  className={`text-sm ${
                    mode === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  You have unsaved changes. Are you sure you want to leave?
                </p>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={handleCancelClose}
                    className={`px-6 py-3 text-sm font-medium rounded-xl border transition-all duration-200 flex items-center shadow-sm hover:scale-105 active:scale-95 ${
                      mode === "dark"
                        ? "border-gray-600 text-gray-200 bg-gray-800 hover:bg-gray-700"
                        : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <Icon icon="heroicons:x-mark" className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className={`px-6 py-3 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-all duration-200 flex items-center shadow-sm hover:scale-105 active:scale-95 ${
                      mode === "dark" ? "shadow-white/10" : "shadow-gray-200"
                    }`}
                  >
                    <Icon
                      icon="heroicons:arrow-right"
                      className="h-4 w-4 mr-2"
                    />
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleModal;
