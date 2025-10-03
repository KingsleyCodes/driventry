// // pages/dashboard/tax.js
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import { getCurrentUser } from '../../lib/auth';
// import DashboardLayout from '../../components/Layout/DashboardLayout';
// import Button from '../../components/UI/Button';
// import { 
//   Calculator, 
//   Download, 
//   Calendar,
//   AlertTriangle,
//   CheckCircle,
//   DollarSign,
//   TrendingUp,
//   FileText,
//   Clock
// } from 'lucide-react';

// export default function TaxDashboard() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [taxData, setTaxData] = useState(null);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [companyType, setCompanyType] = useState('standard');
//   const router = useRouter();

//   // Effect to load user
//   useEffect(() => {
//     getCurrentUser().then((userData) => {
//       if (!userData) {
//         router.push('/');
//         return;
//       }
//       setUser(userData);
//     });
//   }, [router]);

//   // Effect to load tax report when filters or user changes
//   useEffect(() => {
//     if (user) {
//       loadTaxReport();
//     }
//   }, [selectedYear, companyType, user]); // Added user to dependencies

//   // Using useCallback for loadTaxReport to avoid re-renders, 
//   // though for simplicity, keeping it as a standard function called from useEffect is fine too.
//   const loadTaxReport = async () => {
//     // Only proceed if user is available
//     if (!user) return; 
    
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/reports/tax?year=${selectedYear}&companyType=${companyType}`);
      
//       if (!response.ok) {
//         const errorResult = await response.json().catch(() => ({ error: 'Failed to parse error message' }));
//         throw new Error(errorResult.error || 'Failed to load tax report');
//       }

//       const result = await response.json();
//       setTaxData(result);

//     } catch (error) {
//       console.error('Error loading tax report:', error);
//       alert('Error loading tax report: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const exportTaxReport = () => {
//     // Generate and download tax report PDF/CSV
//     alert('Tax report export functionality would be implemented here');
//   };

//   const getDeadlineStatus = (deadline) => {
//     // 🟢 FIX FOR ROBUSTNESS: Explicitly check for null/undefined/empty string deadline
//     if (!deadline) return { status: 'unknown', color: 'gray', text: 'N/A' };
    
//     const today = new Date();
//     // Convert to Date object explicitly, as it might be a string
//     const dueDate = new Date(deadline);
    
//     // 🟢 FIX FOR ROBUSTNESS: Check for Invalid Date
//     if (isNaN(dueDate.getTime())) return { status: 'invalid', color: 'gray', text: 'INVALID DATE' };

//     const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
//     if (daysUntilDue < 0) return { status: 'overdue', color: 'red', text: 'OVERDUE' };
//     if (daysUntilDue <= 30) return { status: 'urgent', color: 'orange', text: 'DUE SOON' };
//     return { status: 'pending', color: 'green', text: 'ON TRACK' };
//   };

//   if (loading || !user) {
//     return (
//       <DashboardLayout user={user} activePage="tax">
//         <div className="p-6">
//           <div className="flex items-center justify-center h-64">
//             <div className="flex flex-col items-center space-y-4">
//               <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
//               <p className="text-gray-600">
//                 {user ? 'Calculating tax liability...' : 'Loading user profile...'}
//               </p>
//             </div>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout user={user} activePage="tax">
//       <div className="p-4 sm:p-6 space-y-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tax Management</h1>
//             <p className="text-gray-600 mt-1 sm:mt-2">Company Income Tax Calculator & Compliance</p>
//           </div>
//           <div className="flex flex-col sm:flex-row gap-3">
//             <Button
//               onClick={loadTaxReport}
//               variant="secondary"
//               className="w-full sm:w-auto"
//             >
//               <Calculator size={16} className="mr-2" />
//               Recalculate
//             </Button>
//             <Button
//               onClick={exportTaxReport}
//               className="w-full sm:w-auto"
//             >
//               <Download size={16} className="mr-2" />
//               Export Report
//             </Button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="card">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Tax Year</label>
//               <select
//                 value={selectedYear}
//                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//                 className="input"
//               >
//                 {[2023, 2024, 2025].map(year => (
//                   <option key={year} value={year}>{year}</option>
//                 ))}
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
//               <select
//                 value={companyType}
//                 onChange={(e) => setCompanyType(e.target.value)}
//                 className="input"
//               >
//                 <option value="small">Small Company (₦25-100M)</option>
//                 <option value="standard">Standard Company (>₦100M)</option>
//               </select>
//             </div>
            
//             <div className="flex items-end">
//               <Button onClick={loadTaxReport} className="w-full">
//                 Update Calculation
//               </Button>
//             </div>
//           </div>
//         </div>

//         {taxData && (
//           <>
//             {/* Tax Summary Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//               <div className="card">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-blue-100 rounded-lg">
//                     <DollarSign size={20} className="text-blue-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="text-sm font-medium text-gray-600">Tax Liability</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       ₦{(taxData.taxCalculation.companyIncomeTax / 100).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="card">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-green-100 rounded-lg">
//                     <TrendingUp size={20} className="text-green-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="text-sm font-medium text-gray-600">Effective Tax Rate</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       {taxData.taxCalculation.effectiveTaxRate.toFixed(1)}%
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="card">
//                 <div className="flex items-center">
//                   <div className="p-3 bg-purple-100 rounded-lg">
//                     <Calendar size={20} className="text-purple-600" />
//                   </div>
//                   <div className="ml-4">
//                     <p className="text-sm font-medium text-gray-600">Monthly Installment</p>
//                     <p className="text-2xl font-semibold text-gray-900">
//                       ₦{(taxData.taxCalculation.monthlyInstallment / 100).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="card">
//                 <div className="flex items-center">
//                   <div className={`p-3 rounded-lg ${
//                     getDeadlineStatus(taxData.taxCalculation.filingDeadline).color === 'red' ? 'bg-red-100' :
//                     getDeadlineStatus(taxData.taxCalculation.filingDeadline).color === 'orange' ? 'bg-orange-100' : 'bg-green-100'
//                   }`}>
//                     <Clock size={20} className={`${
//                       getDeadlineStatus(taxData.taxCalculation.filingDeadline).color === 'red' ? 'text-red-600' :
//                       getDeadlineStatus(taxData.taxCalculation.filingDeadline).color === 'orange' ? 'text-orange-600' : 'text-green-600'
//                     }`} />
//                   </div>
//                   <div className="ml-4">
//                     <p className="text-sm font-medium text-gray-600">Filing Status</p>
//                     <p className={`text-lg font-semibold ${
//                       getDeadlineStatus(taxData.taxCalculation.filingDeadline).color === 'red' ? 'text-red-600' :
//                       getDeadlineStatus(taxData.taxCalculation.filingDeadline).color === 'orange' ? 'text-orange-600' : 'text-green-600'
//                     }`}>
//                       {getDeadlineStatus(taxData.taxCalculation.filingDeadline).text}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Tax Calculation Breakdown */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Income & Expenses */}
//               <div className="card">
//                 <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Summary</h2>
//                 <div className="space-y-3">
//                   {[
//                     { label: 'Gross Turnover', value: taxData.financialSummary.grossTurnover, type: 'revenue' },
//                     { label: 'Cost of Sales', value: taxData.financialSummary.costOfSales, type: 'expense' },
//                     { label: 'Gross Profit', value: taxData.financialSummary.grossProfit, type: 'profit' },
//                     { label: 'Operating Expenses', value: Object.values(taxData.financialSummary.operatingExpenses).reduce((a, b) => a + b, 0), type: 'expense' },
//                     { label: 'Capital Allowances', value: taxData.taxCalculation.capitalAllowances, type: 'deduction' },
//                     { label: 'Taxable Profit', value: taxData.taxCalculation.taxableProfit, type: 'profit' }
//                   ].map((item, index) => (
//                     <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
//                       <span className="text-gray-700">{item.label}</span>
//                       <span className={`font-semibold ${
//                         item.type === 'revenue' ? 'text-green-600' :
//                         item.type === 'expense' ? 'text-red-600' :
//                         item.type === 'profit' ? 'text-blue-600' : 'text-purple-600'
//                       }`}>
//                         ₦{(item.value / 100).toLocaleString()}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Tax Details */}
//               <div className="card">
//                 <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Calculation</h2>
//                 <div className="space-y-4">
//                   <div className="bg-blue-50 p-4 rounded-lg">
//                     <div className="flex justify-between items-center">
//                       <span className="text-blue-800 font-medium">Applicable Tax Rate</span>
//                       <span className="text-blue-800 font-bold">{taxData.taxCalculation.taxRate}%</span>
//                     </div>
//                   </div>
                  
//                   <div className="flex justify-between items-center py-2 border-b border-gray-200">
//                     <span>Tax on Profit</span>
//                     <span className="font-semibold">
//                       ₦{((taxData.taxCalculation.taxableProfit * (taxData.taxCalculation.taxRate / 100)) / 100).toLocaleString()}
//                     </span>
//                   </div>
                  
//                   <div className="flex justify-between items-center py-2 border-b border-gray-200">
//                     <span>Minimum Tax</span>
//                     <span className="font-semibold">
//                       ₦{(taxData.taxCalculation.minimumTax / 100).toLocaleString()}
//                     </span>
//                   </div>
                  
//                   <div className="flex justify-between items-center py-2 border-b border-gray-200 font-bold text-lg">
//                     <span>Final Tax Liability</span>
//                     <span className="text-green-600">
//                       ₦{(taxData.taxCalculation.companyIncomeTax / 100).toLocaleString()}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Provisional Tax Schedule */}
//             <div className="card">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Provisional Tax Schedule</h2>
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="border-b border-gray-200">
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Due Date</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Monthly Amount</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cumulative</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {taxData.provisionalTaxSchedule.map((payment, index) => {
//                       const status = getDeadlineStatus(payment.dueDate);
//                       return (
//                         <tr key={index}>
//                           <td className="px-4 py-3 text-sm text-gray-900">{payment.month}</td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             {/* 🟢 PREVIOUS FIX: Convert payment.dueDate to a Date object */}
//                             {(new Date(payment.dueDate)).toLocaleDateString()}
//                           </td>
//                           <td className="px-4 py-3 text-sm font-medium text-gray-900">
//                             ₦{(payment.amount / 100).toLocaleString()}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-600">
//                             ₦{(payment.cumulative / 100).toLocaleString()}
//                           </td>
//                           <td className="px-4 py-3">
//                             <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
//                               status.color === 'red' ? 'bg-red-100 text-red-800' :
//                               status.color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
//                             }`}>
//                               {status.text}
//                             </span>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Compliance Requirements */}
//             <div className="card">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
//                 <FileText size={20} className="mr-2" />
//                 FIRS Compliance Requirements
//               </h2>
//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                 <div className="flex items-start space-x-3">
//                   <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
//                   <div>
//                     <h3 className="font-medium text-yellow-800">Important Compliance Notes</h3>
//                     <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
//                       <li>File Company Income Tax returns within 6 months of your financial year-end</li>
//                       <li>Pay monthly provisional tax installments by the 21st of each month</li>
//                       <li>Maintain proper books of accounts and supporting documents</li>
//                       <li>Submit audited financial statements with your tax returns</li>
//                       <li>Keep records for at least 6 years for FIRS inspection</li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }