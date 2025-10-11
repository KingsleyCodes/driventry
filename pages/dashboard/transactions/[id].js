// pages/dashboard/transactions/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../../lib/auth';
import { getTransaction } from '../../../lib/firestore';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Package, 
  RefreshCw,
  User,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';

export default function TransactionDetails() {
  const [user, setUser] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    // FIX: Define loadTransaction inside useEffect to ensure it is stable
    // and correctly captured by the effect's dependency list.
    const loadTransaction = async () => {
      try {
        setLoading(true);
        // Note: You'll need to implement getTransaction in firestore.js
        const transactionData = await getTransaction(id);
        setTransaction(transactionData);
      } catch (error) {
        console.error('Error loading transaction:', error);
      } finally {
        setLoading(false);
      }
    };
    // End of FIX

    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/');
        return;
      }
      setUser(userData);
      // Only load transaction if 'id' is available from the router query
      if (id) loadTransaction();
    });
  }, [router, id]); // router and id are correctly included

  // The original loadTransaction function is now removed.

  const getTransactionIcon = (type) => {
    const icons = {
      sale: ShoppingCart,
      arrival: Package,
      refund: RefreshCw,
      swap: RefreshCw,
      correction: RefreshCw
    };
    return icons[type] || ShoppingCart;
  };

  const getTransactionColor = (type) => {
    const colors = {
      sale: 'text-green-600 bg-green-100',
      arrival: 'text-blue-600 bg-blue-100', 
      refund: 'text-orange-600 bg-orange-100',
      swap: 'text-purple-600 bg-purple-100',
      correction: 'text-yellow-600 bg-yellow-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="transactions">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading transaction...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout user={user} activePage="transactions">
        <div className="p-6">
          <div className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Transaction not found</p>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="mt-4 text-blue-600 hover:text-blue-500"
            >
              Back to Transactions
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const IconComponent = getTransactionIcon(transaction.type);

  return (
    <DashboardLayout user={user} activePage="transactions">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Transaction Details
              </h1>
              <p className="text-gray-600 mt-1">
                ID: {transaction.id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Info */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Transaction Information</h2>
                <div className={`p-2 rounded-lg ${getTransactionColor(transaction.type)}`}>
                  <IconComponent size={20} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{transaction.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{transaction.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{transaction.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ${transaction.total?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Items</h2>
              <div className="space-y-3">
                {transaction.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">Product ID: {item.productId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${item.price} × {item.quantity}</p>
                      <p className="text-lg font-semibold text-gray-900">${item.total?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${transaction.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700">{transaction.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Staff Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Information</h2>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.userEmail}</p>
                  <p className="text-sm text-gray-600">Processed by</p>
                </div>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">
                      {transaction.timestamp?.toDate?.().toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            {transaction.customerInfo && (transaction.customerInfo.name || transaction.customerInfo.phone) && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
                <div className="space-y-2">
                  {transaction.customerInfo.name && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{transaction.customerInfo.name}</p>
                    </div>
                  )}
                  {transaction.customerInfo.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{transaction.customerInfo.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  <FileText size={16} />
                  <span>Print Receipt</span>
                </button>
                {(transaction.type === 'sale' || transaction.type === 'refund') && (
                  <button className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <RefreshCw size={16} />
                    <span>Process Refund</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}