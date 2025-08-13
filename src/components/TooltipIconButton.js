// components/TooltipIconButton.jsx
import { Icon } from "@iconify/react";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const TooltipIconButton = ({
  icon,
  label,
  onClick,
  mode = "light",
  className = "",
  children,
  disabled = false,
}) => {
  const btnRef = useRef();
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (show && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
        width: rect.width,
      });
    }
  }, [show]);

  // Hide tooltip on scroll (optional, for better UX)
  useEffect(() => {
    if (!show) return;
    const hide = () => setShow(false);
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [show]);

  return (
    <>
      <div
        ref={btnRef}
        onClick={disabled ? undefined : onClick}
        className={`relative group inline-block z-2 p-2 rounded-full focus:outline-none ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${
          mode === "dark" ? "hover:bg-gray-700" : "hover:bg-sky-50"
        } ${className}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            onClick?.(e);
          }
        }}
        onMouseEnter={() => !disabled && setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => !disabled && setShow(true)}
        onBlur={() => setShow(false)}
        aria-label={label}
        aria-disabled={disabled}
      >
        {children || <Icon icon={icon} className="h-5 w-5" />}
      </div>
      {show && typeof window !== "undefined" && createPortal(
        <div
          style={{
            position: "absolute",
            top: coords.top + 8, // 8px gap
            left: coords.left,
            transform: "translateX(-50%)",
            zIndex: 999999,
            pointerEvents: "none",
          }}
        >
          <div
            className={`
              text-xs py-2 px-3 rounded-lg shadow-lg
              text-center
              ${mode === "dark" ? "text-gray-200 bg-gray-900 border border-gray-700" : "text-gray-900 bg-white border border-gray-200"}
            `}
            style={{
              opacity: 1,
              transition: "opacity 0.2s",
              whiteSpace: "pre-line",
              maxWidth: "250px",
              wordWrap: "break-word",
            }}
          >
            {label}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TooltipIconButton;
