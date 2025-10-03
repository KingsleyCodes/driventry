// components/Layout/DashboardLayout.jsx
import { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  History, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { logoutUser } from '../../lib/auth';

const DashboardLayout = ({ user, children, activePage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Transactions', href: '/dashboard/transactions', icon: ShoppingCart },
    
  ];

  const adminNavigation = [
    { name: 'Activity Logs', href: '/dashboard/logs', icon: History },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Customer Insights', href: '/dashboard/customer-insights', icon: Users },
  ];

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-full max-w-xs bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-primary-600">InventoryPro</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activePage === item.name.toLowerCase()
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} className="mr-3" />
                {item.name}
              </a>
            ))}
            {user?.role === 'admin' && adminNavigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activePage === item.name.toLowerCase().replace(' ', '')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} className="mr-3" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r">
          <div className="flex items-center flex-shrink-0 h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-primary-600">InventoryPro</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activePage === item.name.toLowerCase()
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} className="mr-3" />
                {item.name}
              </a>
            ))}
            {user?.role === 'admin' && adminNavigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activePage === item.name.toLowerCase().replace(' ', '')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} className="mr-3" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="flex flex-shrink-0 p-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center h-16 bg-white border-b md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">InventoryPro</h1>
        </div>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;