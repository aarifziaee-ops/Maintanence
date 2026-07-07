const fs = require('fs');
let code = fs.readFileSync('utils/helpers.ts', 'utf-8');

const newFunctions = `
export const getOutstandingBreakdown = (
  flat: { isRented?: boolean }, 
  totalPaid: number, 
  epochYear: number, 
  epochMonth: number, 
  targetYear: number, 
  targetMonth: number
): { monthName: string, amount: number, year: number }[] => {
  let remainingPaid = totalPaid;
  let currYear = epochYear;
  let currMonth = epochMonth;
  const breakdown: { monthName: string, amount: number, year: number }[] = [];
  
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  while (currYear < targetYear || (currYear === targetYear && currMonth < targetMonth)) {
    const monthlyDue = calculateMaintenanceForMonth(flat, currYear, currMonth);
    if (remainingPaid >= monthlyDue) {
      remainingPaid -= monthlyDue;
    } else {
      const unpaidForMonth = monthlyDue - remainingPaid;
      remainingPaid = 0;
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

export const generateDetailedReminderLink = (
  mobile: string, 
  name: string, 
  flat: string, 
  totalAmount: number,
  breakdown: { monthName: string, amount: number, year: number }[]
): string => {
  const cleanMobile = getCleanLocalMobile(mobile);
  if (!cleanMobile) return '#';
  
  let breakdownText = breakdown.map(b => \`\${b.monthName} \${b.year}: Rs. \${b.amount}\`).join('\\n');
  
  const message = \`Dear \${name || 'Member'},\\n\\nFlat: *\${flat}*\\n\\nYour maintenance payment for *Continental Heights B Wing* is pending.\\n\\nOutstanding Breakdown:\\n\${breakdownText}\\n\\nTotal Amount: *Rs. \${totalAmount}*\\n\\nPlease pay at your earliest convenience.\\n\\nThank you.\`;
  return \`https://wa.me/\${cleanMobile}?text=\${encodeURIComponent(message)}\`;
};
`;

code = code.replace(
  /export const generateReminderLink = /,
  newFunctions + '\nexport const generateReminderLink = '
);

fs.writeFileSync('utils/helpers.ts', code);
