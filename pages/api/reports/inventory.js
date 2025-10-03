// pages/api/reports/inventory.js
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all products
    const productsSnapshot = await adminDb.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get recent transactions for turnover calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactionsSnapshot = await adminDb.collection('transactions')
      .where('timestamp', '>=', thirtyDaysAgo)
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate inventory metrics
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const potentialRevenue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    
    const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    const outOfStockItems = products.filter(p => p.stock === 0);
    const healthyStockItems = products.filter(p => p.stock > p.minStock);

    // Calculate turnover (simplified)
    const salesTransactions = transactions.filter(t => t.type === 'sale');
    const soldItems = salesTransactions.flatMap(t => t.items || []);
    
    const turnoverByProduct = {};
    soldItems.forEach(item => {
      if (!turnoverByProduct[item.productId]) {
        turnoverByProduct[item.productId] = 0;
      }
      turnoverByProduct[item.productId] += item.quantity;
    });

    const productsWithTurnover = products.map(product => ({
      ...product,
      monthlyTurnover: turnoverByProduct[product.id] || 0,
      turnoverRate: product.stock > 0 ? 
        ((turnoverByProduct[product.id] || 0) / product.stock) * 100 : 0
    }));

    // Category analysis
    const categories = {};
    products.forEach(product => {
      const category = getProductCategory(product.name);
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          totalValue: 0,
          totalStock: 0,
          lowStockCount: 0
        };
      }
      categories[category].count++;
      categories[category].totalValue += product.stock * product.cost;
      categories[category].totalStock += product.stock;
      if (product.stock <= product.minStock) {
        categories[category].lowStockCount++;
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalInventoryValue: inventoryValue,
        potentialRevenue: potentialRevenue,
        grossProfitMargin: potentialRevenue - totalCost,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        healthyStockCount: healthyStockItems.length,
        stockHealthPercentage: ((healthyStockItems.length / products.length) * 100).toFixed(1)
      },
      criticalItems: {
        lowStock: lowStockItems.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          needed: p.minStock - p.stock
        })),
        outOfStock: outOfStockItems.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          cost: p.cost
        }))
      },
      categories: Object.entries(categories).map(([name, data]) => ({
        name,
        productCount: data.count,
        totalValue: data.totalValue,
        totalStock: data.totalStock,
        lowStockCount: data.lowStockCount,
        healthPercentage: ((data.count - data.lowStockCount) / data.count * 100).toFixed(1)
      })),
      topSellers: productsWithTurnover
        .filter(p => p.monthlyTurnover > 0)
        .sort((a, b) => b.monthlyTurnover - a.monthlyTurnover)
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          name: p.name,
          monthlyTurnover: p.monthlyTurnover,
          currentStock: p.stock,
          turnoverRate: p.turnoverRate.toFixed(1)
        })),
      slowMoving: productsWithTurnover
        .filter(p => p.monthlyTurnover === 0 && p.stock > 0)
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          name: p.name,
          currentStock: p.stock,
          price: p.price,
          cost: p.cost
        }))
    });

  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ error: error.message });
  }
}

function getProductCategory(productName) {
  const name = (productName || '').toLowerCase();
  if (name.includes('iphone')) return 'iPhone';
  if (name.includes('samsung')) return 'Samsung';
  if (name.includes('pixel')) return 'Google Pixel';
  if (name.includes('oneplus')) return 'OnePlus';
  if (name.includes('xiaomi') || name.includes('redmi')) return 'Xiaomi';
  if (name.includes('case') || name.includes('cover')) return 'Cases & Covers';
  if (name.includes('charger') || name.includes('cable')) return 'Chargers & Cables';
  if (name.includes('headphone') || name.includes('earphone')) return 'Audio';
  if (name.includes('screen protector')) return 'Screen Protectors';
  return 'Other';
}