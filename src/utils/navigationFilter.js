import { sidebarNav } from "@/data/nav";

// Extract all pages from navigation data
function extractAllPages(navigation) {
  const pages = new Set();

  navigation.forEach((item) => {
    // Handle standalone items
    if (item.href) {
      pages.add(item.href);
    }

    // Handle categorized items
    if (item.items) {
      item.items.forEach((subItem) => {
        if (subItem.href) {
          pages.add(subItem.href);
        }
      });
    }
  });

  return Array.from(pages);
}

// Get all pages from navigation
const ALL_PAGES = extractAllPages(sidebarNav);

// Cache for role page permissions
let rolePagePermissionsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch role page permissions from database
async function fetchRolePagePermissions() {
  const now = Date.now();

  // Return cached data if still valid
  if (rolePagePermissionsCache && now - cacheTimestamp < CACHE_DURATION) {
    return rolePagePermissionsCache;
  }

  try {
    const response = await fetch("/api/role-page-permissions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      rolePagePermissionsCache = data.data || [];
      cacheTimestamp = now;
      return rolePagePermissionsCache;
    }
  } catch (error) {
    console.error("Error fetching role page permissions:", error);
  }

  return [];
}

// Get allowed pages for a specific role
async function getRoleAllowedPages(roleName) {
  const rolePermissions = await fetchRolePagePermissions();

  // Find the role by name
  const role = rolePermissions.find((rp) => rp.role_name === roleName);

  if (role) {
    return role.page_paths || [];
  }

  // Fallback to default permissions based on role
  if (roleName === "admin") {
    return ALL_PAGES;
  } else if (roleName === "manager") {
    return ALL_PAGES.filter(
      (page) => !["/users", "/roles-permissions"].includes(page)
    );
  } else if (roleName === "cashier") {
    return ["/", "/dashboard", "/pos", "/messages", "/profile"];
  }

  return [];
}

export async function filterNavigationByRole(navigation, userRole = "cashier") {
  if (!navigation) return [];

  const role = userRole?.toLowerCase() || "cashier";
  const allowedPages = await getRoleAllowedPages(role);

  // If user has access to all pages, return full navigation
  if (allowedPages.includes("*")) {
    return navigation;
  }

  // Filter navigation for specific pages
  return navigation
    .map((item) => {
      // Handle standalone items
      if (item.href) {
        return allowedPages.includes(item.href) ? item : null;
      }

      // Handle categorized items
      if (item.items) {
        const filteredItems = item.items.filter((subItem) =>
          allowedPages.includes(subItem.href)
        );

        // Only include category if it has visible items
        if (filteredItems.length > 0) {
          return {
            ...item,
            items: filteredItems,
          };
        }
        return null;
      }

      return null;
    })
    .filter((item) => item !== null);
}

export async function isPageAccessible(path, userRole = "cashier") {
  const role = userRole?.toLowerCase() || "cashier";
  const allowedPages = await getRoleAllowedPages(role);

  return allowedPages.includes("*") || allowedPages.includes(path);
}

// Export the extracted pages for debugging or other uses
export function getAllPages() {
  return ALL_PAGES;
}

// Clear cache (useful for testing or when permissions change)
export function clearRolePermissionsCache() {
  rolePagePermissionsCache = null;
  cacheTimestamp = 0;
}
