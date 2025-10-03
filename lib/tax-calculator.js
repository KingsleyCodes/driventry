// lib/tax-calculator.js
import { TAX_CONFIG } from './tax-config';

export class TaxCalculator {
  static calculateTaxLiability(financialData, companyType = 'standard') {
    const {
      grossTurnover,
      costOfSales,
      operatingExpenses,
      capitalAssets,
      previousLosses = 0
    } = financialData;

    // 1. Calculate Gross Profit
    const grossProfit = grossTurnover - costOfSales;

    // 2. Calculate Adjusted Profit (Allowable expenses only)
    const allowableExpenses = this.filterAllowableExpenses(operatingExpenses);
    const totalAllowableExpenses = Object.values(allowableExpenses).reduce((sum, amount) => sum + amount, 0);
    
    // 3. Calculate Capital Allowances
    const capitalAllowances = this.calculateCapitalAllowances(capitalAssets);
    
    // 4. Calculate Taxable Profit
    let taxableProfit = grossProfit - totalAllowableExpenses - capitalAllowances;
    
    // 5. Apply Loss Relief (if any)
    if (previousLosses > 0) {
      taxableProfit = Math.max(0, taxableProfit - previousLosses);
    }

    // 6. Determine Tax Rate based on turnover
    const taxRate = this.determineTaxRate(grossTurnover, companyType);
    
    // 7. Calculate Company Income Tax
    let companyIncomeTax = taxableProfit * taxRate;
    
    // 8. Apply Minimum Tax if applicable
    const minimumTax = grossTurnover * TAX_CONFIG.COMPANY_INCOME_TAX.MINIMUM_TAX_RATE;
    companyIncomeTax = Math.max(companyIncomeTax, minimumTax);

    return {
      grossTurnover,
      grossProfit,
      totalAllowableExpenses,
      capitalAllowances,
      taxableProfit,
      taxRate: taxRate * 100,
      companyIncomeTax,
      minimumTax,
      effectiveTaxRate: (companyIncomeTax / grossTurnover) * 100,
      monthlyInstallment: companyIncomeTax / 12,
      filingDeadline: this.calculateFilingDeadline()
    };
  }

  static filterAllowableExpenses(expenses) {
    const allowable = {};
    
    TAX_CONFIG.ALLOWABLE_DEDUCTIONS.forEach(category => {
      if (expenses[category]) {
        // Apply specific limits (e.g., entertainment max 5% of revenue)
        if (category === 'entertainment_expenses') {
          allowable[category] = Math.min(expenses[category], expenses.grossTurnover * 0.05);
        } else {
          allowable[category] = expenses[category];
        }
      }
    });

    return allowable;
  }

  static calculateCapitalAllowances(assets) {
    let totalAllowance = 0;
    
    Object.entries(assets).forEach(([assetType, value]) => {
      const rate = TAX_CONFIG.CAPITAL_ALLOWANCE[assetType.toUpperCase()];
      if (rate) {
        totalAllowance += value * rate;
      }
    });

    return totalAllowance;
  }

  static determineTaxRate(turnover, companyType) {
    const { SMALL_COMPANY_RATE, STANDARD_RATE, TURNOVER_THRESHOLDS } = TAX_CONFIG.COMPANY_INCOME_TAX;
    
    if (companyType === 'small' && turnover <= TURNOVER_THRESHOLDS.STANDARD_COMPANY) {
      return SMALL_COMPANY_RATE;
    }
    
    return STANDARD_RATE;
  }

  static calculateFilingDeadline() {
    const today = new Date();
    const yearEnd = new Date(today.getFullYear(), 11, 31); // Assume Dec 31 year-end
    const filingDeadline = new Date(yearEnd);
    filingDeadline.setMonth(filingDeadline.getMonth() + 6); // 6 months after year-end
    
    return filingDeadline;
  }

  // Calculate monthly provisional tax
  static calculateProvisionalTax(estimatedAnnualTax) {
    const monthly = estimatedAnnualTax / 12;
    const monthlySchedule = [];
    
    for (let month = 0; month < 12; month++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + month);
      dueDate.setDate(21); // Tax due by 21st of each month
      
      monthlySchedule.push({
        month: dueDate.toLocaleString('default', { month: 'long' }),
        dueDate: new Date(dueDate),
        amount: monthly,
        cumulative: monthly * (month + 1)
      });
    }
    
    return monthlySchedule;
  }
}