// pages/dashboard/customer-insights.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../lib/auth';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Modal from '../../components/UI/Modal';
import { 
  Users, 
  Phone, 
  TrendingUp, 
  Clock, 
  Star, 
  MessageCircle,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  PhoneCall
} from 'lucide-react';

export default function CustomerInsights() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followupNotes, setFollowupNotes] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    urgency: 'all',
    minScore: 0.5
  });

  const router = useRouter();

  const FOLLOWUP_TYPES = {
    upgrade_eligible: { label: 'Upgrade Eligible', color: 'purple', icon: TrendingUp },
    support_followup: { label: 'Support Follow-up', color: 'orange', icon: MessageCircle },
    new_arrival_notification: { label: 'New Arrival', color: 'blue', icon: Star },
    loyalty_reward: { label: 'Loyalty Reward', color: 'green', icon: Star }
  };

  const URGENCY_COLORS = {
    high: 'red',
    medium: 'orange', 
    low: 'green'
  };

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/');
        return;
      }
      setUser(userData);
      analyzeCustomers();
    });
  }, [router]);

  const analyzeCustomers = async () => {
    try {
      setAnalyzing(true);
      
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.minScore) params.append('minScore', filters.minScore);

      const response = await fetch(`/api/customers/analyze?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      setCustomers(result.customers);
    } catch (error) {
      console.error('Error analyzing customers:', error);
      alert('Error analyzing customers: ' + error.message);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const scheduleFollowup = async (customer, notes) => {
    try {
      const response = await fetch('/api/customers/followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerPhone: customer.phone,
          type: customer.analysis.type,
          notes: notes,
          userId: user.uid,
          userEmail: user.email,
          status: 'scheduled'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      // Update local state to mark as scheduled
      setCustomers(prev => prev.map(c => 
        c.phone === customer.phone 
          ? { ...c, followupScheduled: true, followupId: result.followupId }
          : c
      ));

      setIsModalOpen(false);
      setFollowupNotes('');
      setSelectedCustomer(null);
      
      alert('Follow-up scheduled successfully!');
    } catch (error) {
      alert('Error scheduling follow-up: ' + error.message);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-orange-100 text-orange-800 border-orange-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[urgency]}`}>
        {urgency.toUpperCase()}
      </span>
    );
  };

  const getConfidenceBadge = (confidence) => {
    let color = 'gray';
    if (confidence >= 80) color = 'green';
    else if (confidence >= 60) color = 'orange';
    else color = 'red';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800 border border-${color}-200`}>
        {Math.round(confidence)}% confidence
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const config = FOLLOWUP_TYPES[type] || { label: type, color: 'gray' };
    const IconComponent = config.icon || Users;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 border border-${config.color}-200`}>
        <IconComponent size={12} className="mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesType = filters.type === 'all' || customer.analysis.type === filters.type;
    const matchesUrgency = filters.urgency === 'all' || customer.analysis.urgency === filters.urgency;
    return matchesType && matchesUrgency;
  });

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="customer-insights">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Analyzing customer data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="customer-insights">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customer Insights</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">AI-powered customer retention suggestions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={analyzeCustomers}
              loading={analyzing}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers Analyzed</p>
                <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upgrade Candidates</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {customers.filter(c => c.analysis.type === 'upgrade_eligible').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <MessageCircle size={20} className="text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Support Follow-ups</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {customers.filter(c => c.analysis.type === 'support_followup').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Star size={20} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {customers.filter(c => c.analysis.urgency === 'high').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input"
            >
              <option value="all">All Types</option>
              {Object.entries(FOLLOWUP_TYPES).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
            
            <select
              value={filters.urgency}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
              className="input"
            >
              <option value="all">All Urgency</option>
              <option value="high">High Urgency</option>
              <option value="medium">Medium Urgency</option>
              <option value="low">Low Urgency</option>
            </select>
            
            <Input
              type="number"
              min="0.1"
              max="1.0"
              step="0.1"
              value={filters.minScore}
              onChange={(e) => handleFilterChange('minScore', parseFloat(e.target.value))}
              placeholder="Min Score (0.1-1.0)"
            />
            
            <Button
              onClick={analyzeCustomers}
              loading={analyzing}
              className="w-full"
            >
              <Filter size={16} className="mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Customer Recommendations */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recommended Follow-ups ({filteredCustomers.length})
          </h2>
          
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.phone} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Customer Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                          <Clock size={14} className="ml-2" />
                          <span>{customer.monthsSinceLastPurchase} months since last purchase</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Transactions:</span>
                        <span className="ml-2 font-medium">{customer.transactionCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="ml-2 font-medium">${customer.totalSpent.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Info */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {getTypeBadge(customer.analysis.type)}
                      {getUrgencyBadge(customer.analysis.urgency)}
                      {getConfidenceBadge(customer.analysis.confidence)}
                    </div>
                    
                    <p className="text-sm text-gray-600 max-w-md">
                      {customer.analysis.reason}
                    </p>
                    
                    <p className="text-sm font-medium text-gray-900">
                      {customer.analysis.suggestedAction}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 min-w-[120px]">
                    <Button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsModalOpen(true);
                      }}
                      size="sm"
                      className="w-full"
                    >
                      <PhoneCall size={16} className="mr-2" />
                      Schedule Call
                    </Button>
                    
                    {customer.followupScheduled && (
                      <span className="inline-flex items-center text-xs text-green-600">
                        <CheckCircle size={12} className="mr-1" />
                        Follow-up Scheduled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No customer recommendations found</p>
              <p className="text-sm text-gray-400 mt-1">
                {customers.length === 0 ? 'Try adjusting your filters or check back later' : 'No customers match your current filters'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
          setFollowupNotes('');
        }}
        title="Schedule Customer Follow-up"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">{selectedCustomer.name}</h3>
              <p className="text-gray-600">{selectedCustomer.phone}</p>
              <div className="mt-2 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-900">AI Recommendation:</p>
                <p className="text-sm text-gray-600 mt-1">{selectedCustomer.analysis.suggestedAction}</p>
                <p className="text-xs text-gray-500 mt-2">{selectedCustomer.analysis.reason}</p>
              </div>
            </div>

            {/* Follow-up Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Notes
              </label>
              <textarea
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                placeholder="Add notes about what to discuss with the customer..."
                rows={4}
                className="input resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Suggested talking points: {selectedCustomer.analysis.suggestedAction}
              </p>
            </div>

            {/* Script Suggestions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Suggested Script:</h4>
              {selectedCustomer.analysis.type === 'upgrade_eligible' && (
                <div className="text-sm text-blue-800">
                  <p>"Hi {selectedCustomer.name}, this is {user?.email} from our store. We noticed you purchased your device about {selectedCustomer.monthsSinceLastPurchase} months ago and wanted to check if you'd be interested in upgrading to the latest models we have available. We have some great trade-in offers right now!"</p>
                </div>
              )}
              {selectedCustomer.analysis.type === 'support_followup' && (
                <div className="text-sm text-blue-800">
                  <p>"Hi {selectedCustomer.name}, this is {user?.email} from our store. We're doing a routine check-in with our valued customers. How has your device been performing? Are you experiencing any issues we can help with, or would you like us to check its condition?"</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => scheduleFollowup(selectedCustomer, followupNotes)}
                className="w-full sm:w-auto"
              >
                <PhoneCall size={16} className="mr-2" />
                Schedule Follow-up Call
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}