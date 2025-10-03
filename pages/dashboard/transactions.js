// pages/dashboard/transactions.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../lib/auth';
import { getTransactions, getProducts } from '../../lib/firestore';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Modal from '../../components/UI/Modal';
import { 
  ShoppingCart, 
  Package, 
  RefreshCw, 
  Search, 
  Filter, 
  Download,
  Plus,
  Eye,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';

export default function Transactions() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const router = useRouter();

  // Transaction form state
  const [formData, setFormData] = useState({
    type: 'sale',
    items: [],
    paymentMethod: 'cash',
    customerName: '',
    customerPhone: '',
    notes: ''
  });

  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/');
        return;
      }
      setUser(userData);
      loadData();
    });
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, productsData] = await Promise.all([
        getTransactions(),
        getProducts()
      ]);
      setTransactions(transactionsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToTransaction = () => {
    if (!selectedProduct || quantity <= 0) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existingItemIndex = formData.items.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].price;
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      const newItem = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        total: product.price * quantity
      };
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }

    // Reset form
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...formData.items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = newQuantity * updatedItems[index].price;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0).toFixed(2);
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item to the transaction');
      return;
    }

    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          total: calculateTotal(),
          userId: user.uid,
          userEmail: user.email,
          customerInfo: {
            name: formData.customerName,
            phone: formData.customerPhone
          }
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      // Reset form and reload data
      setFormData({
        type: 'sale',
        items: [],
        paymentMethod: 'cash',
        customerName: '',
        customerPhone: '',
        notes: ''
      });
      setIsModalOpen(false);
      await loadData();
      
      alert(`Transaction completed successfully! ID: ${result.id}`);
    } catch (error) {
      alert('Error creating transaction: ' + error.message);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.items?.some(item => 
                           item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    const matchesDate = !filterDate || 
                       (transaction.timestamp?.toDate?.().toDateString() === new Date(filterDate).toDateString());

    return matchesSearch && matchesType && matchesDate;
  });

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
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="transactions">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">Manage sales, arrivals, and returns</p>
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
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus size={16} className="mr-2" />
              New Transaction
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input"
            >
              <option value="all">All Types</option>
              <option value="sale">Sales</option>
              <option value="arrival">Arrivals</option>
              <option value="refund">Refunds</option>
              <option value="swap">Swaps</option>
              <option value="correction">Corrections</option>
            </select>
            
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            
            <Button variant="secondary" className="w-full">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Transaction</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Staff</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => {
                  const IconComponent = getTransactionIcon(transaction.type);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${getTransactionColor(transaction.type)}`}>
                            <IconComponent size={16} />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 text-sm">
                              {transaction.id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500 capitalize sm:hidden">
                              {transaction.type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm hidden sm:table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getTransactionColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <DollarSign size={16} className="text-gray-400 mr-1" />
                          <span className="font-semibold text-gray-900">
                            {transaction.total?.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                        {transaction.items?.length || 0} items
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden lg:table-cell">
                        <div className="flex items-center">
                          <User size={14} className="mr-1 text-gray-400" />
                          {transaction.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {transaction.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => router.push(`/dashboard/transactions/${transaction.id}`)}
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

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {transactions.length === 0 ? 'Create your first transaction to get started' : 'Try changing your filters'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart size={20} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${transactions
                    .filter(t => t.type === 'sale')
                    .reduce((sum, t) => sum + (t.total || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package size={20} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {transactions.filter(t => {
                    const today = new Date().toDateString();
                    return t.timestamp?.toDate?.().toDateString() === today;
                  }).length}
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
                  {transactions.filter(t => t.type === 'refund').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar size={20} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {transactions.filter(t => {
                    const now = new Date();
                    const transactionDate = t.timestamp?.toDate?.();
                    return transactionDate && 
                           transactionDate.getMonth() === now.getMonth() && 
                           transactionDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({
            type: 'sale',
            items: [],
            paymentMethod: 'cash',
            customerName: '',
            customerPhone: '',
            notes: ''
          });
        }}
        title="New Transaction"
        size="xl"
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { value: 'sale', label: 'Sale', icon: ShoppingCart, color: 'green' },
                { value: 'arrival', label: 'Arrival', icon: Package, color: 'blue' },
                { value: 'refund', label: 'Refund', icon: RefreshCw, color: 'orange' },
                { value: 'swap', label: 'Swap', icon: RefreshCw, color: 'purple' },
                { value: 'correction', label: 'Correction', icon: RefreshCw, color: 'yellow' }
              ].map((type) => {
                const IconComponent = type.icon;
                return (
                  <label key={type.value} className="relative flex cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="sr-only"
                    />
                    <div className={`w-full p-3 border rounded-lg text-center transition-colors ${
                      formData.type === type.value 
                        ? `border-${type.color}-500 bg-${type.color}-50` 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <IconComponent size={20} className={`mx-auto mb-1 ${
                        formData.type === type.value ? `text-${type.color}-600` : 'text-gray-400'
                      }`} />
                      <p className={`text-xs font-medium ${
                        formData.type === type.value ? `text-${type.color}-900` : 'text-gray-700'
                      }`}>{type.label}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Add Items */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Items</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="input"
              >
                <option value="">Select Product</option>
                {products.filter(p => p.stock > 0 || formData.type !== 'sale').map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Stock: {product.stock} - ${product.price}
                  </option>
                ))}
              </select>
              
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Qty"
              />
              
              <Button
                type="button"
                onClick={addItemToTransaction}
                disabled={!selectedProduct}
                className="w-full"
              >
                Add Item
              </Button>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Items in Transaction:</h4>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">${item.price} each</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-medium w-16 text-right">${item.total.toFixed(2)}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info (for sales) */}
          {(formData.type === 'sale' || formData.type === 'refund') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Name (Optional)"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
              />
              <Input
                label="Customer Phone (Optional)"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="Enter customer phone"
              />
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="input"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this transaction..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={formData.items.length === 0}
              className="w-full sm:w-auto"
            >
              Complete Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}