// pages/api/reports/generate.js
// FIX: Changed '../../../../lib/firebase-admin' to '../../../lib/firebase-admin'
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportType, startDate, endDate, userId } = req.body;

  try {
    let reportData = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    switch (reportType) {
      case 'sales':
        let salesQuery = adminDb.collection('transactions')
          .where('type', '==', 'sale')
          .where('timestamp', '>=', start)
          .where('timestamp', '<=', end);

        if (userId) {
          // NOTE: Ensure you assign the result back to salesQuery if chaining a .where() on the query object
          salesQuery = salesQuery.where('userId', '==', userId); 
        }

        const salesSnapshot = await salesQuery.get();
        const sales = salesSnapshot.docs.map(doc => doc.data());

        reportData = {
          totalSales: sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
          transactionCount: sales.length,
          averageSale: sales.length > 0 ? sales.reduce((sum, sale) => sum + (sale.total || 0), 0) / sales.length : 0,
          salesByUser: sales.reduce((acc, sale) => {
            acc[sale.userEmail] = (acc[sale.userEmail] || 0) + 1;
            return acc;
          }, {})
        };
        break;

      case 'inventory':
        const productsSnapshot = await adminDb.collection('products').get();
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        reportData = {
          totalProducts: products.length,
          lowStockItems: products.filter(p => p.stock <= p.minStock).length,
          outOfStockItems: products.filter(p => p.stock === 0).length,
          totalInventoryValue: products.reduce((sum, product) => sum + (product.stock * product.cost), 0)
        };
        break;

      case 'activity':
        let activityQuery = adminDb.collection('activityLogs')
          .where('timestamp', '>=', start)
          .where('timestamp', '<=', end);

        if (userId) {
          activityQuery = activityQuery.where('userId', '==', userId);
        }

        const activitySnapshot = await activityQuery.get();
        const activities = activitySnapshot.docs.map(doc => doc.data());

        reportData = {
          totalActivities: activities.length,
          activitiesByType: activities.reduce((acc, activity) => {
            acc[activity.action] = (acc[activity.action] || 0) + 1;
            return acc;
          }, {}),
          activitiesByUser: activities.reduce((acc, activity) => {
            acc[activity.userEmail] = (acc[activity.userEmail] || 0) + 1;
            return acc;
          }, {})
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.status(200).json({ success: true, report: reportData });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
}