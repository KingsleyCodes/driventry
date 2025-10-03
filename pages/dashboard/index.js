// pages/dashboard/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../lib/auth';
import { getProducts, getTransactions } from '../../lib/firestore';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import OverviewPanel from '../../components/Dashboard/OverviewPanel';
import { Package, TrendingUp, AlertTriangle, DollarSign, Users, Activity } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/');
        return;
      }
      setUser(userData);
      loadDashboardData();
    });
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const [products, transactions] = await Promise.all([
        getProducts(),
        getTransactions({ limit: 50 }),
      ]);

      // Calculate statistics
      const totalSales = transactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + (t.total || 0), 0);

      const lowStockItems = products.filter(p => p.stock <= p.minStock).length;
      const outOfStockItems = products.filter(p => p.stock === 0).length;

      const today = new Date().toDateString();
      const todayRevenue = transactions
        .filter(t => t.type === 'sale' && t.timestamp?.toDate()?.toDateString() === today)
        .reduce((sum, t) => sum + (t.total || 0), 0);

      const todayTransactions = transactions.filter(
        t => t.timestamp?.toDate()?.toDateString() === today
      ).length;

      // Get recent activities (last 5 transactions)
      const recentActivities = transactions
        .slice(0, 5)
        .map(transaction => ({
          id: transaction.id,
          type: transaction.type,
          userEmail: transaction.userEmail,
          total: transaction.total,
          timestamp: transaction.timestamp,
          items: transaction.items?.length || 0,
        }));

      setStats({
        totalProducts: products.length,
        totalSales,
        lowStockItems,
        outOfStockItems,
        todayRevenue,
        todayTransactions,
      });

      setRecentActivities(recentActivities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'sale': return DollarSign;
      case 'arrival': return Package;
      case 'refund': return TrendingUp;
      default: return Activity;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'sale': return 'text-green-600 bg-green-100';
      case 'arrival': return 'text-blue-600 bg-blue-100';
      case 'refund': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatActivityType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="overview">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="overview">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.email} • {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
          </p>
        </div>

        {/* Stats Overview */}
        <OverviewPanel stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Activity size={20} className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        <IconComponent size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {formatActivityType(activity.type)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.userEmail} • {activity.items} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${activity.total?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.timestamp?.toDate?.().toLocaleTimeString() || 'Recently'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Activity size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Transactions will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              <Users size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              <a
                href="/dashboard/transactions"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
              >
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <DollarSign size={20} className="text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Record Sale</h3>
                  <p className="text-sm text-gray-600">Process a new customer sale</p>
                </div>
              </a>

              <a
                href="/dashboard/products"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
              >
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <Package size={20} className="text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Manage Products</h3>
                  <p className="text-sm text-gray-600">View and edit inventory</p>
                </div>
              </a>

              {user?.role === 'admin' && (
                <a
                  href="/dashboard/reports"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                    <TrendingUp size={20} className="text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">View Reports</h3>
                    <p className="text-sm text-gray-600">Analytics and insights</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}