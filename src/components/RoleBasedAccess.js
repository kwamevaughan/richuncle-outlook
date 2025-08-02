import { useRouter } from 'next/router';
import { useUser } from '@/hooks/useUser';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

export default function RoleBasedAccess({ children }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Skip check if still loading or no user
    if (loading || !user) return;

    const userRole = user.role?.toLowerCase() || 'cashier';
    const currentPath = router.pathname;
    
    // Get allowed pages for user's role
    const allowedPages = ROLE_ACCESS[userRole] || ROLE_ACCESS.cashier;
    
    // Check if user has access to current page
    let userHasAccess = false;
    
    if (allowedPages.includes('*')) {
      // User has access to all pages, check if the path exists in navigation
      userHasAccess = ALL_PAGES.includes(currentPath) || currentPath === '/';
    } else {
      // User has specific allowed pages
      userHasAccess = allowedPages.includes(currentPath);
    }
    
    if (!userHasAccess) {
      // Redirect to first allowed page
      const firstAllowedPage = allowedPages[0] || '/pos';
      toast.error(`Access denied. You don't have permission to access this page.`);
      
      // Immediate redirect
      router.push(firstAllowedPage);
      
      setAccessChecked(true);
      setHasAccess(false);
      return;
    }
    
    // For cashiers, redirect from home page to POS
    if (userRole === 'cashier' && currentPath === '/') {
      router.push('/pos');
      
      setAccessChecked(true);
      setHasAccess(false);
      return;
    }
    
    // User has access
    setAccessChecked(true);
    setHasAccess(true);
  }, [user, loading, router.pathname, router]);

  // Show loading while checking access or if access is denied
  if (loading || !accessChecked || !hasAccess || router.isFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only render children if user has access and access check is complete
  if (accessChecked && hasAccess) {
    return children;
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
} 