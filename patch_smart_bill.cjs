const fs = require('fs');
let code = fs.readFileSync('utils/helpers.ts', 'utf-8');

const oldFunc = `export const generateSmartBillLink = (
  mobile: string, 
  name: string, 
  flat: string, 
  monthStr: string, 
  current: number, 
  arrears: number, 
  total: number
): string => {
  const cleanMobile = getCleanLocalMobile(mobile);
  if (!cleanMobile) return '#';
  
  const arrearsText = arrears > 0 
    ? \`\\nPrevious Arrears: *Rs. \${arrears}*\` 
    : (arrears < 0 ? \`\\nAdvance Balance: *Rs. \${Math.abs(arrears)}*\` : '');
    
  const message = \`*MAINTENANCE BILL*\\n\${BUILDING_NAME}\\n\\nDear \${name || 'Member'},\\n\\nYour maintenance bill for *\${monthStr}* has been generated for Flat *\${flat}*.\\n\\nCurrent Month: *Rs. \${current}*\${arrearsText}\\n*Total Payable: Rs. \${total}*\\n\\nPlease pay by the 10th of the month to avoid late fees.\\n\\nThank you.\`;
  
  return \`https://wa.me/\${cleanMobile}?text=\${encodeURIComponent(message)}\`;
};`;

const newFunc = `export const generateSmartBillLink = (
  mobile: string, 
  name: string, 
  flat: string, 
  monthStr: string, 
  current: number, 
  arrears: number, 
  total: number,
  breakdown: { monthName: string, amount: number, year: number }[] = []
): string => {
  const cleanMobile = getCleanLocalMobile(mobile);
  if (!cleanMobile) return '#';
  
  let arrearsText = '';
  if (arrears > 0 && breakdown.length > 0) {
     const breakdownText = breakdown.map(b => \`\${b.monthName} \${b.year} Rs. \${b.amount}\`).join(', ');
     arrearsText = \`\\nPrevious Arrears: *Rs. \${arrears}* (Pending: \${breakdownText})\`;
  } else if (arrears > 0) {
     arrearsText = \`\\nPrevious Arrears: *Rs. \${arrears}*\`;
  } else if (arrears < 0) {
     arrearsText = \`\\nAdvance Balance: *Rs. \${Math.abs(arrears)}*\`;
  }
    
  const message = \`*MAINTENANCE BILL*\\n\${BUILDING_NAME}\\n\\nDear \${name || 'Member'},\\n\\nYour maintenance bill for *\${monthStr}* has been generated for Flat *\${flat}*.\\n\\nCurrent Month: *Rs. \${current}*\${arrearsText}\\n*Total Payable: Rs. \${total}*\\n\\nPlease pay by the 10th of every month so that we can run the services of the building.\\n\\nSociety office timing is from 8:00 PM to 10:00 PM.\\n\\nThank you.\`;
  
  return \`https://wa.me/\${cleanMobile}?text=\${encodeURIComponent(message)}\`;
};`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('utils/helpers.ts', code);
