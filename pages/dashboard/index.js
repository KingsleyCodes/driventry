import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';
import { getProducts, getTransactions, getActivityLogs } from '../../lib/firestore';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import OverviewPanel from '../../components/Dashboard/OverviewPanel';
import { Package, TrendingUp, AlertTriangle, DollarSign, Users, Activity, ShoppingCart } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [products, transactions, activityLogs] = await Promise.all([
        getProducts(),
        getTransactions({ limit: 100 }),
        getActivityLogs({ limit: 10 })
      ]);

      // Calculate today's date and yesterday's date
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

      // Calculate statistics
      const totalSales = transactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + (t.total || 0), 0);

      // Today's sales
      const todaySales = transactions
        .filter(t => t.type === 'sale' && 
          t.timestamp?.toDate() >= todayStart && 
          t.timestamp?.toDate() <= todayEnd
        )
        .reduce((sum, t) => sum + (t.total || 0), 0);

      // Yesterday's sales
      const yesterdaySales = transactions
        .filter(t => t.type === 'sale' && 
          t.timestamp?.toDate() >= yesterdayStart && 
          t.timestamp?.toDate() <= yesterdayEnd
        )
        .reduce((sum, t) => sum + (t.total || 0), 0);

      const lowStockItems = products.filter(p => p.stock <= (p.minStock || 5)).length; 
      const outOfStockItems = products.filter(p => p.stock === 0).length;

      const todayTransactions = transactions.filter(
        t => t.timestamp?.toDate() >= todayStart && t.timestamp?.toDate() <= todayEnd
      ).length;

      // Get recent activities (mix of transactions and important logs)
      const activities = transactions
        .slice(0, 8)
        .map(transaction => ({
          id: transaction.id,
          type: 'transaction',
          transactionType: transaction.type,
          userEmail: transaction.userEmail,
          total: transaction.total,
          timestamp: transaction.timestamp,
          items: transaction.items?.length || 0,
          description: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} transaction`
        }));

      // Add important activity logs
      const importantLogs = activityLogs
        .filter(log => 
          log.action.includes('product_created') || 
          log.action.includes('user_created') ||
          log.action.includes('user_deactivated')
        )
        .slice(0, 2)
        .map(log => ({
          id: log.id,
          type: 'activity',
          action: log.action,
          userEmail: log.userEmail,
          timestamp: log.timestamp,
          description: log.details
        }));

      const allActivities = [...activities, ...importantLogs]
        .sort((a, b) => b.timestamp?.toDate?.() - a.timestamp?.toDate?.())
        .slice(0, 6);

      setStats({
        totalProducts: products.length,
        totalSales,
        todaySales,
        yesterdaySales,
        lowStockItems,
        outOfStockItems,
        todayTransactions,
        totalTransactions: transactions.length,
        salesGrowth: yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales * 100) : 0
      });

      setRecentActivities(allActivities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/');
        return;
      }
      setUser(userData);
      loadDashboardData();
    });
  }, [router, loadDashboardData]);

  const getActivityIcon = (activity) => {
    if (activity.type === 'activity') {
      switch (activity.action) {
        case 'product_created': return Package;
        case 'user_created': return Users;
        case 'user_deactivated': return Users;
        default: return Activity;
      }
    } else {
      switch (activity.transactionType) {
        case 'sale': return ShoppingCart;
        case 'arrival': return Package;
        case 'refund': return TrendingUp;
        default: return Activity;
      }
    }
  };

  const getActivityColor = (activity) => {
    if (activity.type === 'activity') {
      return 'text-purple-600 bg-purple-100';
    } else {
      switch (activity.transactionType) {
        case 'sale': return 'text-green-600 bg-green-100';
        case 'arrival': return 'text-blue-600 bg-blue-100';
        case 'refund': return 'text-orange-600 bg-orange-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const formatActivityDescription = (activity) => {
    if (activity.type === 'transaction') {
      return `${activity.transactionType.charAt(0).toUpperCase() + activity.transactionType.slice(1)} • ${activity.items} items`;
    }
    return activity.description?.substring(0, 50) + (activity.description?.length > 50 ? '...' : '');
  };

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="overview">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.email} • {new Date().toLocaleDateString('en-NG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Overview */}
        <OverviewPanel stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Activity size={20} className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const IconComponent = getActivityIcon(activity);
                  return (
                    <div 
                      key={activity.id} 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (activity.type === 'transaction') {
                          router.push(`/dashboard/transactions/${activity.id}`);
                        }
                      }}
                    >
                      <div className={`p-2 rounded-lg ${getActivityColor(activity)}`}>
                        <IconComponent size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.userEmail}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {formatActivityDescription(activity)}
                        </p>
                      </div>
                      <div className="text-right">
                        {activity.total && (
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(activity.total)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {activity.timestamp?.toDate?.().toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || 'Recently'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Activity size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Activities will appear here as they occur</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              <Users size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                href="/dashboard/transactions"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <ShoppingCart size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Record Transaction</h3>
                  <p className="text-sm text-gray-600">Process sales, arrivals, or returns</p>
                </div>
              </Link>

              <Link
                href="/dashboard/products"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Manage Products</h3>
                  <p className="text-sm text-gray-600">View and edit inventory</p>
                </div>
              </Link>

              {user?.role === 'admin' && (
                <Link
                  href="/dashboard/reports"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <TrendingUp size={20} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">View Reports</h3>
                    <p className="text-sm text-gray-600">Analytics and insights</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}