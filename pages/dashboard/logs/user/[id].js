// pages/dashboard/logs/user/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../../../lib/auth';
import { getUserActivityLogs, getUsers } from '../../../../lib/firestore';
import DashboardLayout from '../../../../components/Layout/DashboardLayout';
import Button from '../../components/UI/Button';
import { 
  ArrowLeft, 
  History, 
  User, 
  Mail, 
  Calendar,
  Shield
} from 'lucide-react';

export default function UserActivityLogs() {
  const [user, setUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

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
      if (id) loadUserData();
    });
  }, [router, id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [users, userLogs] = await Promise.all([
        getUsers(),
        getUserActivityLogs(id)
      ]);
      
      const foundUser = users.find(u => u.id === id);
      setTargetUser(foundUser);
      setLogs(userLogs);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="logs">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading user activity...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!targetUser) {
    return (
      <DashboardLayout user={user} activePage="logs">
        <div className="p-6">
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">User not found</p>
            <button
              onClick={() => router.push('/dashboard/logs')}
              className="mt-4 text-blue-600 hover:text-blue-500"
            >
              Back to Activity Logs
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="logs">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/logs')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                User Activity Logs
              </h1>
              <p className="text-gray-600 mt-1">
                Activity history for {targetUser.email}
              </p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{targetUser.email}</h2>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Shield size={16} className="text-gray-400" />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                    targetUser.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {targetUser.role}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{targetUser.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Joined: {targetUser.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <History size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {logs.length} activities
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
          
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className={`p-2 rounded-lg mt-1 ${getActionColor(log.action)}`}>
                  <History size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {formatActionText(log.action)}
                    </h3>
                    <span className="text-sm text-gray-500 mt-1 sm:mt-0">
                      {log.timestamp?.toDate?.().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  
                  {log.changes && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {log.changes.before && (
                          <div>
                            <span className="font-medium text-red-600">Before:</span>
                            <pre className="mt-1 text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(log.changes.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.changes.after && (
                          <div>
                            <span className="font-medium text-green-600">After:</span>
                            <pre className="mt-1 text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(log.changes.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No activities found for this user</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}