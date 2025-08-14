import React from "react";
import { Icon } from "@iconify/react";

// Comprehensive status configurations for different contexts
const STATUS_CONFIGS = {
  // Sales/Order statuses
  sales: {
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: "mdi:check-circle",
      label: "Completed",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      icon: "mdi:clock-outline",
      label: "Pending",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      icon: "mdi:close-circle",
      label: "Cancelled",
    },
    refunded: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-200",
      icon: "mdi:undo-variant",
      label: "Refunded",
    },
    processing: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
      icon: "mdi:cog-outline",
      label: "Processing",
    },
  },

  // Inventory/Stock statuses
  inventory: {
    "in stock": {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: "mdi:check-circle",
      label: "In Stock",
    },
    "low stock": {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      icon: "mdi:alert-circle",
      label: "Low Stock",
    },
    "out of stock": {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      icon: "mdi:close-circle",
      label: "Out of Stock",
    },
    discontinued: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
      icon: "mdi:archive-outline",
      label: "Discontinued",
    },
    backordered: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-200",
      icon: "mdi:truck-delivery",
      label: "Backordered",
    },
  },

  // User/Account statuses
  user: {
    active: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: "mdi:check-circle",
      label: "Active",
    },
    inactive: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
      icon: "mdi:minus-circle",
      label: "Inactive",
    },
    suspended: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      icon: "mdi:pause-circle",
      label: "Suspended",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      icon: "mdi:clock-outline",
      label: "Pending",
    },
  },

  // Payment statuses
  payment: {
    paid: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: "mdi:check-circle",
      label: "Paid",
    },
    unpaid: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      icon: "mdi:close-circle",
      label: "Unpaid",
    },
    "partially paid": {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      icon: "mdi:clock-outline",
      label: "Partially Paid",
    },
    overdue: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      icon: "mdi:alert-circle",
      label: "Overdue",
    },
  },

  // Generic boolean statuses
  boolean: {
    true: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: "mdi:check-circle",
      label: "Yes",
    },
    false: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
      icon: "mdi:close-circle",
      label: "No",
    },
  },
};

// Default fallback configuration
const DEFAULT_CONFIG = {
  bg: "bg-gray-100",
  text: "text-gray-800",
  border: "border-gray-200",
  icon: "mdi:help-circle",
  label: "Unknown",
};

/**
 * Reusable StatusPill component for displaying status badges across the application
 *
 * @param {string} status - The status value to display
 * @param {string} context - The context/type of status (sales, inventory, user, payment, boolean)
 * @param {boolean} showIcon - Whether to show the icon (default: true)
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'sm')
 * @param {string} variant - Style variant: 'default', 'solid' (default: 'default')
 * @param {string} customLabel - Custom label to override the default
 */
export default function StatusPill({
  status,
  context = "sales",
  showIcon = true,
  size = "sm",
  variant = "default",
  customLabel,
}) {
  // Normalize status to lowercase and handle different input types
  let normalizedStatus = "";
  if (typeof status === "boolean") {
    normalizedStatus = status.toString();
    context = "boolean";
  } else if (status !== null && status !== undefined) {
    normalizedStatus = status.toString().toLowerCase().trim();
  }

  // Get the appropriate status configuration
  const contextConfig = STATUS_CONFIGS[context] || STATUS_CONFIGS.sales;
  const config = contextConfig[normalizedStatus] || DEFAULT_CONFIG;

  // Size configurations
  const sizeClasses = {
    sm: {
      container: "px-3 py-1.5 text-xs",
      icon: "w-3 h-3",
      gap: "gap-1.5",
    },
    md: {
      container: "px-4 py-2 text-sm",
      icon: "w-4 h-4",
      gap: "gap-2",
    },
    lg: {
      container: "px-5 py-2.5 text-base",
      icon: "w-5 h-5",
      gap: "gap-2.5",
    },
  };

  const sizeConfig = sizeClasses[size] || sizeClasses.sm;

  // Variant configurations
  const variantClasses = {
    default: `${config.bg} ${config.text} ${config.border} border`,
    solid: `${config.bg.replace("100", "500")} text-white border-transparent`,
  };

  const variantClass = variantClasses[variant] || variantClasses.default;

  // Determine the label to display
  const displayLabel = customLabel || config.label;

  return (
    <span
      className={`inline-flex items-center ${sizeConfig.gap} ${sizeConfig.container} rounded-full font-semibold shadow-sm ${variantClass}`}
      title={displayLabel} // Tooltip for accessibility
    >
      {showIcon && (
        <Icon
          icon={config.icon}
          className={sizeConfig.icon}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

// Export helper function to determine stock status based on quantity
export const getStockStatus = (currentStock, minStock = 0, maxStock = null) => {
  if (currentStock <= 0) return "out of stock";
  if (currentStock <= minStock) return "low stock";
  return "in stock";
};

// Export helper function to determine inventory status with more context
export const getInventoryStatus = (product) => {
  const { current_stock = 0, min_stock = 0, is_active = true } = product;

  if (!is_active) return "discontinued";
  if (current_stock <= 0) return "out of stock";
  if (current_stock <= min_stock) return "low stock";
  return "in stock";
};
