// components/Layout/DashboardLayout.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase'; // Import auth directly instead of app
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  History, 
  Users, 
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';

const DashboardLayout = ({ user, children, activePage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Transactions', href: '/dashboard/transactions', icon: ShoppingCart },
  ];

  const adminNavigation = [
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Activity Logs', href: '/dashboard/logs', icon: History },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth); // Use auth directly
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href, pageName) => {
    if (activePage) {
      return activePage === pageName.toLowerCase().replace(' ', '');
    }
    return router.pathname === href;
  };

  const NavItem = ({ item }) => {
    const active = isActive(item.href, item.name);
    return (
      <Link
        href={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          active
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon size={20} className="mr-3" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75" 
          onClick={() => setSidebarOpen(false)} 
        />
        <div className="relative flex flex-col w-full max-w-xs bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-blue-600">InventoryPro</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            {user?.role === 'admin' && adminNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
          <div className="flex flex-shrink-0 p-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User size={16} className="text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r">
          <div className="flex items-center flex-shrink-0 h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-blue-600">InventoryPro</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            {user?.role === 'admin' && adminNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
          <div className="flex flex-shrink-0 p-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User size={16} className="text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center h-16 bg-white border-b md:hidden px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="ml-4 flex-1">
            <h1 className="text-lg font-semibold text-gray-900">InventoryPro</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200 border border-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;