// pages/dashboard/logs.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../lib/auth';
import { getActivityLogs, getUsers } from '../../lib/firestore';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Modal from '../../components/UI/Modal';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  User,
  ShoppingCart,
  Package,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  FileText
} from 'lucide-react';

export default function ActivityLogs() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    userId: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Available actions for filter
  const ACTION_TYPES = [
    'user_login',
    'user_created',
    'user_updated',
    'user_deactivated',
    'user_activated',
    'user_role_updated',
    'product_created',
    'product_updated',
    'product_deleted',
    'transaction_sale',
    'transaction_arrival',
    'transaction_refund',
    'transaction_swap',
    'transaction_correction',
    'stock_sale',
    'stock_arrival',
    'stock_refund',
    'stock_correction'
  ];

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/');
        return;
      }
      if (userData.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(userData);
      loadData();
    });
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, usersData] = await Promise.all([
        getActivityLogs(),
        getUsers()
      ]);
      setLogs(logsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/activity-logs/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      userId: '',
      action: '',
      startDate: '',
      endDate: ''
    });
  };

  // Filter logs based on current filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filters.search || 
      log.userEmail?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.details?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.action?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesUser = !filters.userId || log.userId === filters.userId;
    const matchesAction = !filters.action || log.action === filters.action;
    
    const matchesDate = !filters.startDate || !filters.endDate || 
      (log.timestamp?.toDate?.() >= new Date(filters.startDate) && 
       log.timestamp?.toDate?.() <= new Date(filters.endDate));

    return matchesSearch && matchesUser && matchesAction && matchesDate;
  });

  const getActionIcon = (action) => {
    const icons = {
      user_login: User,
      user_created: User,
      user_updated: Edit2,
      user_deactivated: Trash2,
      user_activated: User,
      user_role_updated: Edit2,
      product_created: Package,
      product_updated: Edit2,
      product_deleted: Trash2,
      transaction_sale: ShoppingCart,
      transaction_arrival: Package,
      transaction_refund: RefreshCw,
      transaction_swap: RefreshCw,
      transaction_correction: Edit2,
      stock_sale: ShoppingCart,
      stock_arrival: Package,
      stock_refund: RefreshCw,
      stock_correction: Edit2
    };
    return icons[action] || History;
  };

  const getActionColor = (action) => {
    if (action.includes('deleted') || action.includes('deactivated')) {
      return 'text-red-600 bg-red-100';
    }
    if (action.includes('created')) {
      return 'text-green-600 bg-green-100';
    }
    if (action.includes('updated') || action.includes('edited')) {
      return 'text-blue-600 bg-blue-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  const formatActionText = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="logs">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading activity logs...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="logs">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity Logs</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">Audit trail of all system activities</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={loadData}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              loading={exportLoading}
              className="w-full sm:w-auto"
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="input"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="input"
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map(action => (
                <option key={action} value={action}>
                  {formatActionText(action)}
                </option>
              ))}
            </select>
            
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              placeholder="Start Date"
            />
            
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              placeholder="End Date"
            />
          </div>
          
          {(filters.userId || filters.action || filters.startDate || filters.endDate) && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredLogs.length} of {logs.length} logs
              </p>
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Activity Logs List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const IconComponent = getActionIcon(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                            <IconComponent size={16} />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 text-sm">
                              {formatActionText(log.action)}
                            </p>
                            <p className="text-xs text-gray-500 lg:hidden">
                              {log.details?.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <User size={14} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{log.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden lg:table-cell">
                        {log.details}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {log.timestamp?.toDate?.().toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => viewLogDetails(log)}
                          className="p-1.5 text-blue-600 transition-colors rounded hover:bg-blue-50"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <History size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No activity logs found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {logs.length === 0 ? 'Activities will appear here as they occur' : 'Try changing your filters'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <History size={20} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-semibold text-gray-900">{logs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart size={20} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {logs.filter(log => log.action.includes('transaction')).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User size={20} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">User Activities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {logs.filter(log => log.action.includes('user')).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package size={20} className="text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Product Changes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {logs.filter(log => log.action.includes('product') || log.action.includes('stock')).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Activity Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-2 ${getActionColor(selectedLog.action)}`}>
                    {React.createElement(getActionIcon(selectedLog.action), { size: 16 })}
                  </div>
                  <p className="font-medium text-gray-900 capitalize">
                    {formatActionText(selectedLog.action)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                <p className="text-gray-900">
                  {selectedLog.timestamp?.toDate?.().toLocaleString() || 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <p className="text-gray-900">{selectedLog.userEmail}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-sm">{selectedLog.userId}</p>
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {selectedLog.details}
              </p>
            </div>

            {/* Changes (if any) */}
            {selectedLog.changes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Changes</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.changes.before && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Before</h4>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.changes.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.changes.after && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">After</h4>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.changes.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Related IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedLog.transactionId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedLog.transactionId}</p>
                </div>
              )}
              
              {selectedLog.productId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedLog.productId}</p>
                </div>
              )}
              
              {selectedLog.targetUserId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target User ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedLog.targetUserId}</p>
                </div>
              )}
              
              {selectedLog.targetUserEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target User Email</label>
                  <p className="text-gray-900">{selectedLog.targetUserEmail}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}