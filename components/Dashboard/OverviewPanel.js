import { Package, TrendingUp, AlertTriangle, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function OverviewPanel({ stats, loading }) {
  const cards = [
    {
      title: 'Total Products',
      value: stats.totalProducts || 0,
      icon: Package,
      color: 'blue',
      description: 'Items in inventory',
      trend: null
    },
    {
      title: 'Today\'s Sales',
      value: formatCurrency(stats.todaySales || 0),
      icon: ShoppingCart,
      color: 'green',
      description: 'Revenue today',
      trend: stats.salesGrowth,
      trendLabel: 'vs yesterday'
    },
    {
      title: 'Low Stock',
      value: stats.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'orange',
      description: 'Need restocking',
      trend: null
    },
    {
      title: 'Total Sales',
      value: formatCurrency(stats.totalSales || 0),
      icon: TrendingUp,
      color: 'purple',
      description: 'All-time revenue',
      trend: null
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        iconBg: 'bg-blue-100'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        iconBg: 'bg-green-100'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        iconBg: 'bg-orange-100'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        iconBg: 'bg-purple-100'
      }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        const colors = getColorClasses(card.color);
        
        return (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-sm border ${colors.border} p-6 transition-all duration-300 hover:shadow-md hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${colors.text}`}>{card.value}</p>
                <div className="flex items-center mt-2">
                  <p className="text-xs text-gray-500">{card.description}</p>
                  {card.trend !== undefined && card.trend !== null && (
                    <span className={`ml-2 text-xs flex items-center ${
                      card.trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.trend >= 0 ? (
                        <ArrowUp size={12} className="mr-1" />
                      ) : (
                        <ArrowDown size={12} className="mr-1" />
                      )}
                      {Math.abs(card.trend).toFixed(1)}%
                      <span className="text-gray-400 text-xs ml-1">{card.trendLabel}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${colors.iconBg} ${colors.text}`}>
                <IconComponent size={24} />
              </div>
            </div>
            
            {/* Progress bar for low stock items */}
            {card.title === 'Low Stock' && stats.totalProducts > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, ((stats.lowStockItems || 0) / stats.totalProducts) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((stats.lowStockItems || 0) / stats.totalProducts * 100).toFixed(1)}% of inventory
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}