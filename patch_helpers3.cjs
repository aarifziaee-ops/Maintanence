const fs = require('fs');
let code = fs.readFileSync('utils/helpers.ts', 'utf-8');

const newGetOutstandingBreakdown = `
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
    const monthlyDue = calculateMaintenanceForMonth(flat, currYear, currMonth);
    
    // Format YYYY-MM
    const monthStr = \`\${currYear}-\${currMonth.toString().padStart(2, '0')}\`;
    const monthTransactions = getTransactionsForMonth(transactions, monthStr).filter(t => t.flatId === flat.id);
    
    const paidForThisMonth = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const unpaidForMonth = monthlyDue - paidForThisMonth;
    
    if (unpaidForMonth > 0) {
      breakdown.push({
        monthName: MONTHS_LONG[currMonth - 1],
        amount: unpaidForMonth,
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
  newGetOutstandingBreakdown.trim()
);

fs.writeFileSync('utils/helpers.ts', code);
