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
  if (rolePagePermissionsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return rolePagePermissionsCache;
  }
  
  try {
    const response = await fetch('/api/role-page-permissions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      rolePagePermissionsCache = data.data || [];
      cacheTimestamp = now;
      return rolePagePermissionsCache;
    }
  } catch (error) {
    console.error('Error fetching role page permissions:', error);
  }
  
  return [];
}

// Get allowed pages for a specific role
async function getRoleAllowedPages(roleName) {
  const rolePermissions = await fetchRolePagePermissions();
  
  // Find the role by name
  const role = rolePermissions.find(rp => rp.role_name === roleName);
  
  if (role) {
    return role.page_paths || [];
  }
  
  // Fallback to default permissions based on role
  if (roleName === 'admin') {
    return ALL_PAGES;
  } else if (roleName === 'manager') {
    return ALL_PAGES.filter(page => !['/users', '/roles-permissions'].includes(page));
  } else if (roleName === 'cashier') {
    return ['/pos', '/messages', '/'];
  }
  
  return [];
}

export default function RoleBasedAccess({ children }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Skip check if still loading or no user
    if (loading || !user) return;

    const checkAccess = async () => {
      const userRole = user.role?.toLowerCase() || 'cashier';
      const currentPath = router.pathname;
      
      // Check if user has access to current page
      let userHasAccess = false;
      let allowedPages = [];
      
      try {
        allowedPages = await getRoleAllowedPages(user.role);
        
        if (allowedPages.includes('*')) {
          // User has access to all pages, check if the path exists in navigation
          userHasAccess = ALL_PAGES.includes(currentPath) || currentPath === '/';
        } else {
          // User has specific allowed pages
          userHasAccess = allowedPages.includes(currentPath);
        }
      } catch (error) {
        console.error('Error checking page access:', error);
        // Fallback to default behavior
        userHasAccess = true;
      }
      
          if (!userHasAccess) {
      // Redirect to first allowed page
      const firstAllowedPage = allowedPages[0] || '/pos';
      const pageName = currentPath === '/' ? 'Home' : currentPath.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      toast.error(`Access denied. You don't have permission to access the "${pageName}" page.`);
      
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
    };

    checkAccess();
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