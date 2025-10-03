// components/Dashboard/OverviewPanel.jsx
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

const OverviewPanel = ({ stats }) => {
  const cards = [
    {
      title: 'Total Products',
      value: stats.totalProducts || 0,
      icon: Package,
      color: 'blue',
    },
    {
      title: 'Total Sales',
      value: `$${stats.totalSales?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      title: 'Today\'s Revenue',
      value: `$${stats.todayRevenue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="card">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
              <card.icon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewPanel;