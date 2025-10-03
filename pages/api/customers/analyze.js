// pages/api/customers/analyze.js
import { adminDb } from '../../../lib/firebase-admin';
import { CustomerAnalysisEngine, CUSTOMER_FOLLOWUP_TYPES } from '../../../lib/customer-analysis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit = 50, minScore = 0.5 } = req.query;

  try {
    // Get all transactions with customer info
    const transactionsSnapshot = await adminDb.collection('transactions')
      .where('customerInfo.name', '!=', '')
      .orderBy('timestamp', 'desc')
      .limit(500) // Get recent transactions for analysis
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all products for analysis
    const productsSnapshot = await adminDb.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group transactions by customer (using phone number as identifier)
    const customersMap = new Map();

    transactions.forEach(transaction => {
      if (transaction.customerInfo?.phone) {
        const phone = transaction.customerInfo.phone;
        if (!customersMap.has(phone)) {
          customersMap.set(phone, {
            phone: phone,
            name: transaction.customerInfo.name || 'Unknown',
            transactions: [],
            totalSpent: 0,
            firstPurchase: null,
            lastPurchase: null
          });
        }
        
        const customer = customersMap.get(phone);
        customer.transactions.push(transaction);
        customer.totalSpent += transaction.total || 0;
        
        const purchaseDate = transaction.timestamp?.toDate?.();
        if (purchaseDate) {
          if (!customer.firstPurchase || purchaseDate < customer.firstPurchase) {
            customer.firstPurchase = purchaseDate;
          }
          if (!customer.lastPurchase || purchaseDate > customer.lastPurchase) {
            customer.lastPurchase = purchaseDate;
          }
        }
      }
    });

    // Analyze each customer
    const analyzedCustomers = [];
    const minScoreNum = parseFloat(minScore);

    for (const [phone, customer] of customersMap) {
      if (customer.transactions.length === 0) continue;

      const analysis = CustomerAnalysisEngine.analyzeCustomerForFollowup(
        customer.transactions,
        products,
        customer
      );

      if (analysis && analysis.score >= minScoreNum) {
        analyzedCustomers.push({
          ...customer,
          analysis,
          transactionCount: customer.transactions.length,
          monthsSinceLastPurchase: CustomerAnalysisEngine.getMonthsDifference(
            customer.lastPurchase,
            new Date()
          )
        });
      }
    }

    // Sort by analysis score (highest first) and limit results
    const sortedCustomers = analyzedCustomers
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      customers: sortedCustomers,
      summary: {
        totalAnalyzed: customersMap.size,
        recommendedFollowups: sortedCustomers.length,
        byType: Object.values(CUSTOMER_FOLLOWUP_TYPES).reduce((acc, type) => {
          acc[type] = sortedCustomers.filter(c => c.analysis.type === type).length;
          return acc;
        }, {}),
        byUrgency: {
          high: sortedCustomers.filter(c => c.analysis.urgency === 'high').length,
          medium: sortedCustomers.filter(c => c.analysis.urgency === 'medium').length,
          low: sortedCustomers.filter(c => c.analysis.urgency === 'low').length
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing customers:', error);
    res.status(500).json({ error: error.message });
  }
}