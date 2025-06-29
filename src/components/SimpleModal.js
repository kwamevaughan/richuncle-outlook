import { Icon } from "@iconify/react";
import { useState } from "react";

const SimpleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  mode = "light",
  width = "max-w-2xl",
  rightElement,
  hasUnsavedChanges = false 
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!isOpen) return null;

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[50] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Glassmorphic Background */}
        <div
          className={`fixed inset-0 transition-all duration-500 backdrop-blur-sm
            ${
              mode === "dark"
                ? "bg-gradient-to-br from-slate-900/20 via-blue-900/10 to-blue-900/20"
                : "bg-gradient-to-br from-white/20 via-blue-50/30 to-blue-50/20"
            }`}
          onClick={handleClose}
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0, 123, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(100, 149, 237, 0.1) 0%, transparent 50%)
            `,
          }}
        />

        {/* Modal Content */}
        <div
          className="flex min-h-full items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`relative w-full ${width} rounded-3xl transform transition-all duration-500 max-h-[85vh] overflow-hidden
              shadow-2xl shadow-black/20
              ${
                mode === "dark"
                  ? "bg-gray-900 text-white border border-white/10"
                  : "bg-white/20 text-gray-900 border border-white/20"
              } 
              backdrop-blur-xl`}
            style={{
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium Header with Gradient Overlay */}
            <div
              className={`relative px-8 py-3 overflow-hidden ${
                mode === "dark" ? "bg-blue-600" : "bg-[#172840]"
              }`}
              style={{
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-lg transform translate-x-12 translate-y-12"></div>
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
                    className="group p-3 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95"
                    style={{
                      backdropFilter: "blur(4px)",
                      background: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Icon
                      icon="heroicons:x-mark"
                      className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-90"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area with Subtle Glass Effect */}
            <div
              className={`p-8 overflow-y-auto max-h-[calc(85vh-120px)] ${
                mode === "dark" ? "bg-gray-900/45" : "bg-white/60"
              }`}
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
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

            {/* Subtle Border Enhancement */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.2) 0%, 
                    transparent 20%, 
                    transparent 80%, 
                    rgba(255, 255, 255, 0.1) 100%
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
          className="fixed inset-0 z-[60] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`fixed inset-0 transition-all duration-500 backdrop-blur-sm
              ${
                mode === "dark"
                  ? "bg-gradient-to-br from-slate-900/20 via-blue-900/10 to-blue-900/20"
                  : "bg-gradient-to-br from-white/20 via-blue-50/30 to-blue-50/20"
              }`}
            onClick={handleCancelClose}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className={`relative w-full max-w-md rounded-3xl transform transition-all duration-500
                shadow-2xl shadow-black/20
                ${
                  mode === "dark"
                    ? "bg-gray-900 text-white border border-white/10"
                    : "bg-white/20 text-gray-900 border border-white/20"
                } 
                backdrop-blur-xl`}
              style={{
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`relative px-8 py-3 overflow-hidden rounded-t-3xl ${
                  mode === "dark" ? "bg-blue-600" : "bg-blue-500"
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
                    className={`px-6 py-3 text-sm font-medium rounded-xl border transition-all duration-200 flex items-center shadow-sm ${
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
                    className={`px-6 py-3 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-all duration-200 flex items-center shadow-sm ${
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
