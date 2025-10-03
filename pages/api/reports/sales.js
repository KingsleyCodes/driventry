// pages/api/reports/sales.js
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = 'week', startDate, endDate, userId } = req.query;

  try {
    let start, end;
    const now = new Date();

    // Set date range based on period
    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        end = new Date();
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date();
        break;
      case 'custom':
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(now.setDate(now.getDate() - 7));
        end = new Date();
    }

    // Build query for transactions
    let transactionsQuery = adminDb.collection('transactions')
      .where('timestamp', '>=', start)
      .where('timestamp', '<=', end);

    if (userId) {
      transactionsQuery = transactionsQuery.where('userId', '==', userId);
    }

    const transactionsSnapshot = await transactionsQuery.get();
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get products for inventory analysis
    const productsSnapshot = await adminDb.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get users for staff performance
    const usersSnapshot = await adminDb.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate sales metrics
    const salesData = calculateSalesMetrics(transactions, start, end);
    const inventoryData = calculateInventoryMetrics(products);
    const staffPerformance = calculateStaffPerformance(transactions, users);

    res.status(200).json({
      success: true,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        label: period
      },
      sales: salesData,
      inventory: inventoryData,
      staff: staffPerformance,
      summary: {
        totalRevenue: salesData.totalRevenue,
        totalTransactions: salesData.totalTransactions,
        averageSale: salesData.averageSale,
        lowStockItems: inventoryData.lowStockCount,
        topPerformer: staffPerformance.topPerformer
      }
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: error.message });
  }
}

// Helper functions
function calculateSalesMetrics(transactions, start, end) {
  const sales = transactions.filter(t => t.type === 'sale');
  const refunds = transactions.filter(t => t.type === 'refund');
  const arrivals = transactions.filter(t => t.type === 'arrival');

  const totalRevenue = sales.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalRefunds = refunds.reduce((sum, t) => sum + (t.total || 0), 0);
  const netRevenue = totalRevenue - totalRefunds;

  // Daily breakdown
  const dailyData = {};
  const current = new Date(start);
  while (current <= end) {
    const dateKey = current.toISOString().split('T')[0];
    dailyData[dateKey] = {
      date: new Date(current),
      revenue: 0,
      transactions: 0,
      refunds: 0
    };
    current.setDate(current.getDate() + 1);
  }

  sales.forEach(transaction => {
    const dateKey = transaction.timestamp?.toDate?.().toISOString().split('T')[0];
    if (dateKey && dailyData[dateKey]) {
      dailyData[dateKey].revenue += transaction.total || 0;
      dailyData[dateKey].transactions += 1;
    }
  });

  refunds.forEach(transaction => {
    const dateKey = transaction.timestamp?.toDate?.().toISOString().split('T')[0];
    if (dateKey && dailyData[dateKey]) {
      dailyData[dateKey].refunds += transaction.total || 0;
    }
  });

  return {
    totalRevenue: netRevenue,
    grossRevenue: totalRevenue,
    totalRefunds: totalRefunds,
    totalTransactions: sales.length,
    refundCount: refunds.length,
    arrivalCount: arrivals.length,
    averageSale: sales.length > 0 ? totalRevenue / sales.length : 0,
    dailyBreakdown: Object.values(dailyData),
    transactionTypes: {
      sales: sales.length,
      refunds: refunds.length,
      arrivals: arrivals.length,
      swaps: transactions.filter(t => t.type === 'swap').length,
      corrections: transactions.filter(t => t.type === 'correction').length
    }
  };
}

function calculateInventoryMetrics(products) {
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const outOfStockItems = products.filter(p => p.stock === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const potentialRevenue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  // Product categories analysis (simple keyword-based)
  const categories = {};
  products.forEach(product => {
    const name = product.name?.toLowerCase() || '';
    let category = 'Other';
    
    if (name.includes('iphone')) category = 'iPhone';
    else if (name.includes('samsung')) category = 'Samsung';
    else if (name.includes('pixel')) category = 'Google Pixel';
    else if (name.includes('oneplus')) category = 'OnePlus';
    else if (name.includes('accessory') || name.includes('case') || name.includes('charger')) category = 'Accessories';

    if (!categories[category]) {
      categories[category] = { count: 0, value: 0, items: [] };
    }
    categories[category].count++;
    categories[category].value += product.stock * product.cost;
    categories[category].items.push(product);
  });

  return {
    totalProducts,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    totalInventoryValue,
    potentialRevenue,
    stockHealth: ((totalProducts - lowStockItems.length) / totalProducts * 100).toFixed(1),
    lowStockItems: lowStockItems.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock
    })),
    categories: Object.entries(categories).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      percentage: ((data.count / totalProducts) * 100).toFixed(1)
    }))
  };
}

function calculateStaffPerformance(transactions, users) {
  const staffPerformance = {};
  const activeUsers = users.filter(u => u.active !== false);

  // Initialize staff data
  activeUsers.forEach(user => {
    staffPerformance[user.id] = {
      email: user.email,
      role: user.role,
      totalSales: 0,
      totalRevenue: 0,
      transactionCount: 0,
      refundCount: 0,
      averageSale: 0
    };
  });

  // Calculate performance metrics
  transactions.forEach(transaction => {
    const staff = staffPerformance[transaction.userId];
    if (staff) {
      staff.transactionCount++;
      
      if (transaction.type === 'sale') {
        staff.totalSales++;
        staff.totalRevenue += transaction.total || 0;
      } else if (transaction.type === 'refund') {
        staff.refundCount++;
      }
    }
  });

  // Calculate averages
  Object.values(staffPerformance).forEach(staff => {
    staff.averageSale = staff.totalSales > 0 ? staff.totalRevenue / staff.totalSales : 0;
  });

  const staffArray = Object.values(staffPerformance)
    .filter(staff => staff.transactionCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    allStaff: staffArray,
    topPerformer: staffArray[0] || null,
    totalActiveStaff: activeUsers.length,
    summary: {
      totalRevenue: staffArray.reduce((sum, staff) => sum + staff.totalRevenue, 0),
      totalTransactions: staffArray.reduce((sum, staff) => sum + staff.transactionCount, 0),
      averageRevenuePerStaff: staffArray.length > 0 ? 
        staffArray.reduce((sum, staff) => sum + staff.totalRevenue, 0) / staffArray.length : 0
    }
  };
}