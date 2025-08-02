import { sidebarNav } from '@/data/nav';

// Extract all pages from navigation data
function extractAllPages(navigation) {
  const pages = new Set();
  
  navigation.forEach(item => {
    // Handle standalone items
    if (item.href) {
      pages.add(item.href);
    }
    
    // Handle categorized items
    if (item.items) {
      item.items.forEach(subItem => {
        if (subItem.href) {
          pages.add(subItem.href);
        }
      });
    }
  });
  
  return Array.from(pages);
}

// Define allowed pages for each role
const ROLE_ACCESS = {
  cashier: ['/pos', '/messages', '/'],
  manager: ['*'], // All pages
  admin: ['*'], // All pages
};

// Get all pages from navigation
const ALL_PAGES = extractAllPages(sidebarNav);

export function filterNavigationByRole(navigation, userRole = 'cashier') {
  if (!navigation) return [];
  
  const role = userRole?.toLowerCase() || 'cashier';
  const allowedPages = ROLE_ACCESS[role] || ROLE_ACCESS.cashier;
  
  // If user has access to all pages, return full navigation
  if (allowedPages.includes('*')) {
    return navigation;
  }
  
  // Filter navigation for cashiers
  return navigation.filter(item => {
    // Handle standalone items
    if (item.href) {
      return allowedPages.includes(item.href);
    }
    
    // Handle categorized items
    if (item.items) {
      const filteredItems = item.items.filter(subItem => 
        allowedPages.includes(subItem.href)
      );
      
      // Only include category if it has visible items
      if (filteredItems.length > 0) {
        return {
          ...item,
          items: filteredItems
        };
      }
      return false;
    }
    
    return false;
  });
}

export function isPageAccessible(path, userRole = 'cashier') {
  const role = userRole?.toLowerCase() || 'cashier';
  const allowedPages = ROLE_ACCESS[role] || ROLE_ACCESS.cashier;
  
  // If user has access to all pages, check if the path exists in navigation
  if (allowedPages.includes('*')) {
    return ALL_PAGES.includes(path) || path === '/';
  }
  
  return allowedPages.includes(path);
}

// Export the extracted pages for debugging or other uses
export function getAllPages() {
  return ALL_PAGES;
} 