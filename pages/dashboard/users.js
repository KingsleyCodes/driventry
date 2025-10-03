// pages/dashboard/users.js - Updated with real API calls
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../lib/auth';
import { getUsers, updateUserRole, deactivateUser, activateUser, createStaffUser } from '../../lib/firestore';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Modal from '../../components/UI/Modal';
import { Users, UserPlus, Edit2, Trash2, Shield, User, Mail, Calendar, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function UsersManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const router = useRouter();

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
      loadUsers();
    });
  }, [router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      setError('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create staff user via API
      const result = await createStaffUser(formData, user.uid, user.email);
      
      setSuccess(`Staff account created successfully for ${formData.email}`);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'staff'
      });
      setIsModalOpen(false);
      
      // Reload users
      await loadUsers();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserRole(userId, newRole, user.uid, user.email);
      setSuccess(`User role updated to ${newRole}`);
      await loadUsers();
    } catch (error) {
      setError('Failed to update user role: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to deactivate ${userEmail}? This will prevent them from logging in.`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await deactivateUser(userId, user.uid, user.email);
      setSuccess(`User ${userEmail} has been deactivated`);
      await loadUsers();
    } catch (error) {
      setError('Failed to deactivate user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateUser = async (userId, userEmail) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await activateUser(userId, user.uid, user.email);
      setSuccess(`User ${userEmail} has been activated`);
      await loadUsers();
    } catch (error) {
      setError('Failed to activate user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      staff: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role]}`}>
        {role === 'admin' ? <Shield size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
        {role.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (active) => {
    return active ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle size={12} className="mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <XCircle size={12} className="mr-1" />
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="users">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="users">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">Manage staff accounts and permissions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={loadUsers}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <UserPlus size={16} className="mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded-lg border border-red-200">
            <div className="flex items-center">
              <XCircle size={20} className="mr-2" />
              {error}
            </div>
          </div>
        )}
        
        {success && (
          <div className="p-4 text-green-700 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle size={20} className="mr-2" />
              {success}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 hidden sm:table-cell">Role</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Status</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Joined</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Mail size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{userItem.email}</p>
                          <p className="text-xs text-gray-500 sm:hidden">
                            {userItem.role} • {userItem.active !== false ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm hidden sm:table-cell">
                      {getRoleBadge(userItem.role)}
                    </td>
                    <td className="px-3 py-4 text-sm hidden md:table-cell">
                      {getStatusBadge(userItem.active !== false)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600 hidden lg:table-cell">
                      {userItem.createdAt?.toDate?.().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) || 'Unknown'}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {userItem.id !== user?.uid && (
                          <>
                            <select
                              value={userItem.role}
                              onChange={(e) => handleUpdateRole(userItem.id, e.target.value)}
                              disabled={actionLoading}
                              className="text-xs sm:text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                            
                            {userItem.active !== false ? (
                              <button
                                onClick={() => handleDeactivateUser(userItem.id, userItem.email)}
                                disabled={actionLoading}
                                className="p-1.5 text-red-600 transition-colors rounded hover:bg-red-50 disabled:opacity-50"
                                title="Deactivate user"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(userItem.id, userItem.email)}
                                disabled={actionLoading}
                                className="p-1.5 text-green-600 transition-colors rounded hover:bg-green-50 disabled:opacity-50"
                                title="Activate user"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </>
                        )}
                        {userItem.id === user?.uid && (
                          <span className="text-xs text-gray-500 px-2 py-1 border border-gray-300 rounded">
                            Current User
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No users found</p>
                <p className="text-sm text-gray-400 mt-1">Add your first staff member to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield size={20} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <User size={20} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.active !== false).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Calendar size={20} className="text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => {
                    const created = u.createdAt?.toDate?.();
                    if (!created) return false;
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            role: 'staff'
          });
          setError('');
        }}
        title="Add Staff Member"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="staff@company.com"
            required
            autoComplete="off"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative flex cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="staff"
                  checked={formData.role === 'staff'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="sr-only"
                />
                <div className={`w-full p-4 border rounded-lg text-center transition-colors ${
                  formData.role === 'staff' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <User size={20} className={`mx-auto mb-2 ${
                    formData.role === 'staff' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium ${
                    formData.role === 'staff' ? 'text-blue-900' : 'text-gray-700'
                  }`}>Staff</p>
                  <p className="text-xs text-gray-500 mt-1">Basic access</p>
                </div>
              </label>

              <label className="relative flex cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="sr-only"
                />
                <div className={`w-full p-4 border rounded-lg text-center transition-colors ${
                  formData.role === 'admin' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <Shield size={20} className={`mx-auto mb-2 ${
                    formData.role === 'admin' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium ${
                    formData.role === 'admin' ? 'text-purple-900' : 'text-gray-700'
                  }`}>Admin</p>
                  <p className="text-xs text-gray-500 mt-1">Full access</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={actionLoading}
              className="w-full sm:w-auto"
            >
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}