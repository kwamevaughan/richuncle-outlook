import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'mdi:view-dashboard' },
  { name: 'Orders', href: '/orders', icon: 'mdi:shopping' },
  { name: 'Products', href: '/products', icon: 'mdi:package-variant' },
  { name: 'Customers', href: '/customers', icon: 'mdi:account-group' },
  { name: 'Registers', href: '/registers', icon: 'mdi:point-of-sale' },
  { name: 'Reports', href: '/reports', icon: 'mdi:chart-bar' },
  { name: 'Settings', href: '/settings', icon: 'mdi:cog' },
];

const Sidebar = () => {
  const router = useRouter();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">RichUncle</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    router.pathname === item.href
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    icon={item.icon}
                    className={`mr-3 h-6 w-6 ${
                      router.pathname === item.href
                        ? 'text-gray-500 dark:text-gray-300'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
