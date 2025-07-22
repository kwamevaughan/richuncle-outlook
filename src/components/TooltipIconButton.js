// components/TooltipIconButton.jsx
import { Icon } from "@iconify/react";

const TooltipIconButton = ({
  icon,
  label,
  onClick,
  mode = "light",
  className = "",
  children,
}) => {
  return (
    <div className="relative group inline-block z-50">
      <div
        onClick={onClick}
        className={`p-2 rounded-full focus:outline-none cursor-pointer ${
          mode === "dark" ? "hover:bg-gray-700" : "hover:bg-sky-50"
        } ${className}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick?.(e);
          }
        }}
      >
        {children || <Icon icon={icon} className="h-5 w-5" />}
      </div>
      <div
        className={`
          absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max
          bg-white text-xs py-2 px-3 rounded-full shadow-lg
          opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
          transition-all duration-200 ease-in-out
          ${mode === "dark" ? "text-gray-200" : "text-gray-900"}
          before:content-[''] before:absolute before:-top-1.5 before:left-1/2
          before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-white
        `}
      >
        {label}
      </div>
    </div>
  );
};

export default TooltipIconButton;
