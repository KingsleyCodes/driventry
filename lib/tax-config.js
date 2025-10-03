// lib/tax-config.js
export const TAX_CONFIG = {
  // Nigeria Company Income Tax Rates
  COMPANY_INCOME_TAX: {
    STANDARD_RATE: 0.30, // 30%
    SMALL_COMPANY_RATE: 0.20, // 20% for turnover ₦25-100M
    MINIMUM_TAX_RATE: 0.005, // 0.5% minimum tax
    TURNOVER_THRESHOLDS: {
      SMALL_COMPANY: 25000000, // ₦25 million
      STANDARD_COMPANY: 100000000 // ₦100 million
    }
  },
  
  // Allowable Deductions (Based on CITA)
  ALLOWABLE_DEDUCTIONS: [
    'cost_of_sales',
    'employee_salaries',
    'rent_expenses', 
    'utility_bills',
    'transport_costs',
    'marketing_expenses',
    'professional_fees',
    'depreciation',
    'interest_expenses',
    'repairs_maintenance'
  ],
  
  // Non-Allowable Expenses (Not deductible)
  NON_ALLOWABLE: [
    'personal_expenses',
    'fines_penalties',
    'political_contributions',
    'entertainment_excess' // Limited to 5% of revenue
  ],
  
  // Capital Allowance Rates (Depreciation for tax purposes)
  CAPITAL_ALLOWANCE: {
    BUILDINGS: 0.10, // 10% per annum
    PLANT_MACHINERY: 0.20, // 20% per annum  
    MOTOR_VEHICLES: 0.25, // 25% per annum
    // FIX: Changed invalid number 0.33.33 to a fraction (1/3) or rounded float
    COMPUTERS: 0.3333 // 33.33% per annum (using 0.3333 for precision)
  }
};