// pages/api/reports/tax.js
import { adminDb } from '../../../lib/firebase-admin';
import { TaxCalculator } from '../../../lib/tax-calculator';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year = new Date().getFullYear(), companyType = 'standard' } = req.query;

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get transactions for the year
    const transactionsSnapshot = await adminDb.collection('transactions')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get products for cost calculation
    const productsSnapshot = await adminDb.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate financial data from transactions
    const financialData = calculateFinancialData(transactions, products, year);
    
    // Calculate tax liability
    const taxReport = TaxCalculator.calculateTaxLiability(financialData, companyType);
    
    // Calculate provisional tax schedule
    const provisionalTax = TaxCalculator.calculateProvisionalTax(taxReport.companyIncomeTax);

    res.status(200).json({
      success: true,
      taxYear: year,
      companyType,
      financialSummary: financialData,
      taxCalculation: taxReport,
      provisionalTaxSchedule: provisionalTax,
      compliance: {
        filingDeadline: taxReport.filingDeadline,
        monthlyDueDate: '21st of each month',
        requiredDocuments: [
          'Audited Financial Statements',
          'Tax Computation Schedule', 
          'Capital Allowance Schedule',
          'Self-Assessment Form'
        ]
      }
    });

  } catch (error) {
    console.error('Error generating tax report:', error);
    res.status(500).json({ error: error.message });
  }
}

function calculateFinancialData(transactions, products, year) {
  const sales = transactions.filter(t => t.type === 'sale');
  const purchases = transactions.filter(t => t.type === 'arrival');
  
  // Calculate Gross Turnover
  const grossTurnover = sales.reduce((sum, t) => sum + (t.total || 0), 0);
  
  // Calculate Cost of Sales
  const costOfSales = calculateCostOfSales(sales, products);
  
  // Estimate operating expenses (you would normally track these separately)
  const operatingExpenses = estimateOperatingExpenses(transactions, grossTurnover);
  
  // Estimate capital assets (you would track these separately)
  const capitalAssets = estimateCapitalAssets();

  return {
    grossTurnover,
    costOfSales,
    operatingExpenses,
    capitalAssets,
    netProfit: grossTurnover - costOfSales - Object.values(operatingExpenses).reduce((sum, amount) => sum + amount, 0)
  };
}

function calculateCostOfSales(sales, products) {
  let totalCost = 0;
  
  sales.forEach(transaction => {
    transaction.items?.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        totalCost += item.quantity * product.cost;
      }
    });
  });
  
  return totalCost;
}

function estimateOperatingExpenses(transactions, grossTurnover) {
  // These would come from your expense tracking system
  // For now, we'll use typical percentages for a phone business
  return {
    employee_salaries: grossTurnover * 0.15, // 15% of revenue
    rent_expenses: grossTurnover * 0.08,     // 8% of revenue  
    utility_bills: grossTurnover * 0.03,     // 3% of revenue
    transport_costs: grossTurnover * 0.02,   // 2% of revenue
    marketing_expenses: grossTurnover * 0.05, // 5% of revenue
    professional_fees: grossTurnover * 0.02, // 2% of revenue
    repairs_maintenance: grossTurnover * 0.01, // 1% of revenue
    entertainment_expenses: grossTurnover * 0.02 // 2% of revenue (capped at 5%)
  };
}

function estimateCapitalAssets() {
  // These would come from your fixed asset register
  return {
    plant_machinery: 500000,   // ₦500,000 for equipment
    motor_vehicles: 3000000,   // ₦3,000,000 for delivery vehicles
    computers: 800000,         // ₦800,000 for computers/tablets
    furniture: 400000          // ₦400,000 for furniture
  };
}