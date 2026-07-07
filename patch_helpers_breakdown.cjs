const fs = require('fs');
let code = fs.readFileSync('utils/helpers.ts', 'utf-8');

const newBreakdown = `
export const getOutstandingBreakdown = (
  flat: { id: string, isRented?: boolean }, 
  transactions: any[], 
  epochYear: number, 
  epochMonth: number, 
  targetYear: number, 
  targetMonth: number
): { monthName: string, amount: number, year: number }[] => {
  let currYear = epochYear;
  let currMonth = epochMonth;
  const breakdown: { monthName: string, amount: number, year: number }[] = [];
  
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  while (currYear < targetYear || (currYear === targetYear && currMonth < targetMonth)) {
    // Format YYYY-MM
    const monthStr = \`\${currYear}-\${currMonth.toString().padStart(2, '0')}\`;
    const monthTransactions = getTransactionsForMonth(transactions, monthStr);
    
    // If they have ANY transaction for this month, consider it paid.
    // This perfectly matches the logic of the "Pending" page month-wise.
    const hasPaid = monthTransactions.some(t => t.flatId === flat.id);
    
    if (!hasPaid) {
      const monthlyDue = calculateMaintenanceForMonth(flat, currYear, currMonth);
      breakdown.push({
        monthName: MONTHS_LONG[currMonth - 1],
        amount: monthlyDue,
        year: currYear
      });
    }
    
    currMonth++;
    if (currMonth > 12) {
      currMonth = 1;
      currYear++;
    }
  }
  
  return breakdown;
};
`;

code = code.replace(
  /export const getOutstandingBreakdown = \([\s\S]*?return breakdown;\n\};/,
  newBreakdown.trim()
);

fs.writeFileSync('utils/helpers.ts', code);
