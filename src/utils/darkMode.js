// Dark mode utility functions
export const darkModeClasses = {
  // Common patterns
  input: "border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
  select: "border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
  button: {
    primary: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
    danger: "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600",
    success: "bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600",
  },
  card: "bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700",
  modal: "bg-white dark:bg-gray-800",
  text: {
    primary: "text-gray-900 dark:text-gray-100",
    secondary: "text-gray-600 dark:text-gray-400",
    muted: "text-gray-500 dark:text-gray-500",
  },
  background: "bg-gray-50 dark:bg-gray-900",
  border: "border-gray-200 dark:border-gray-700",
};

// Helper function to get dark mode classes
export const getDarkModeClasses = (baseClasses, darkClasses) => {
  return `${baseClasses} ${darkClasses}`;
};

// Common component patterns
export const componentClasses = {
  formInput: "w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
  formLabel: "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2",
  formSelect: "w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
  card: "bg-white border border-gray-200 rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700",
  modal: "bg-white dark:bg-gray-800",
  button: {
    primary: "px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary: "px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
    danger: "px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors dark:bg-red-500 dark:hover:bg-red-600",
    success: "px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors dark:bg-green-500 dark:hover:bg-green-600",
  },
}; 