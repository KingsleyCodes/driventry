// pages/dashboard/reports.js
import { useState, useEffect, useCallback } from 'react'; // <-- Import useCallback
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../lib/auth';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ShoppingCart,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Reports() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [period, setPeriod] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const router = useRouter();

  // FIX: Use useCallback to create a stable loadReports function
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load sales report
      const salesParams = new URLSearchParams({ period });
      if (period === 'custom' && startDate && endDate) {
        salesParams.append('startDate', startDate);
        salesParams.append('endDate', endDate);
      }

      const [salesResponse, inventoryResponse] = await Promise.all([
        fetch(`/api/reports/sales?${salesParams.toString()}`),
        fetch('/api/reports/inventory')
      ]);

      if (!salesResponse.ok || !inventoryResponse.ok) {
        throw new Error('Failed to load reports');
      }

      const salesResult = await salesResponse.json();
      const inventoryResult = await inventoryResponse.json();

      setSalesData(salesResult);
      setInventoryData(inventoryResult);
      setStaffData(salesResult.staff);

    } catch (error) {
      console.error('Error loading reports:', error);
      // NOTE: Using a stale value of `loading` here. Using an alert isn't ideal in React,
      // but keeping it for consistency with the original code.
      alert('Error loading reports: ' + error.message);
    } finally {
      // NOTE: setLoading(false) must be called to end the loading state
      setLoading(false);
    }
  }, [period, startDate, endDate]); // Dependencies for loadReports

  // FIX: Include loadReports in the dependency array
  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/');
        return;
      }
      setUser(userData);
      // Call loadReports here
      loadReports();
    });
  }, [router, loadReports]); // Now includes router and the stable loadReports

  const exportReport = async (type) => {
    try {
      let url = '';
      switch (type) {
        case 'sales':
          url = `/api/reports/sales?period=${period}&export=csv`;
          break;
        case 'inventory':
          url = '/api/reports/inventory?export=csv';
          break;
        default:
          return;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const getPeriodLabel = () => {
    const labels = {
      today: 'Today',
      week: 'Last 7 Days',
      month: 'This Month',
      year: 'This Year',
      custom: 'Custom Range'
    };
    return labels[period] || period;
  };

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="reports">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="reports">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">
              Business intelligence and performance insights
              {salesData && ` • ${getPeriodLabel()}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={loadReports}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => exportReport(activeTab)}
              className="w-full sm:w-auto"
            >
              <Download size={16} className="mr-2" />
              Export {activeTab === 'sales' ? 'Sales' : 'Inventory'} CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {period === 'custom' && (
              <>
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </>
            )}

            <div className="flex items-end">
              <Button
                onClick={loadReports}
                className="w-full"
              >
                <Filter size={16} className="mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'sales', name: 'Sales Report', icon: DollarSign },
              { id: 'inventory', name: 'Inventory Report', icon: Package },
              { id: 'staff', name: 'Staff Performance', icon: Users }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent size={16} className="mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sales Report */}
        {activeTab === 'sales' && salesData && (
          <div className="space-y-6">
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${salesData.sales.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingCart size={20} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Transactions</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {salesData.sales.totalTransactions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp size={20} className="text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Sale</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${salesData.sales.averageSale.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <RefreshCw size={20} className="text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Refunds</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {salesData.sales.refundCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Types */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Types</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(salesData.sales.transactionTypes).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{type}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Revenue</h2>
              <div className="space-y-3">
                {salesData.sales.dailyBreakdown.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                       {(new Date(day.date)).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${day.revenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{day.transactions} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Report */}
        {activeTab === 'inventory' && inventoryData && (
          <div className="space-y-6">
            {/* Inventory Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {inventoryData.summary.totalProducts}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${inventoryData.summary.totalInventoryValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {inventoryData.summary.lowStockCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <XCircle size={20} className="text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {inventoryData.summary.outOfStockCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low Stock Items */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle size={20} className="text-red-600 mr-2" />
                  Low Stock Items ({inventoryData.criticalItems.lowStock.length})
                </h2>
                <div className="space-y-3">
                  {inventoryData.criticalItems.lowStock.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-red-600">
                          Stock: {item.stock} / Min: {item.minStock} (Need {item.needed})
                        </p>
                      </div>
                    </div>
                  ))}
                  {inventoryData.criticalItems.lowStock.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No low stock items</p>
                  )}
                </div>
              </div>

              {/* Out of Stock Items */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <XCircle size={20} className="text-orange-600 mr-2" />
                  Out of Stock ({inventoryData.criticalItems.outOfStock.length})
                </h2>
                <div className="space-y-3">
                  {inventoryData.criticalItems.outOfStock.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-orange-600">Price: ${item.price}</p>
                      </div>
                    </div>
                  ))}
                  {inventoryData.criticalItems.outOfStock.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No out of stock items</p>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {inventoryData.categories.map((category, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Products: {category.productCount}</p>
                      <p>Value: ${category.totalValue.toFixed(2)}</p>
                      <p>Stock: {category.totalStock} units</p>
                      <p className={`font-medium ${
                        parseFloat(category.healthPercentage) > 80 ? 'text-green-600' : 
                        parseFloat(category.healthPercentage) > 60 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        Health: {category.healthPercentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Staff Performance */}
        {activeTab === 'staff' && staffData && (
          <div className="space-y-6">
            {/* Staff Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Staff</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {staffData.totalActiveStaff}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${staffData.summary.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ShoppingCart size={20} className="text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {staffData.summary.totalTransactions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp size={20} className="text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg/Staff</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${staffData.summary.averageRevenuePerStaff.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Performance List */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Performance Ranking</h2>
              <div className="space-y-4">
                {staffData.allStaff.map((staff, index) => (
                  <div key={staff.email} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.email}</p>
                        <p className="text-sm text-gray-600 capitalize">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${staff.totalRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {staff.totalSales} sales • ${staff.averageSale.toFixed(2)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}