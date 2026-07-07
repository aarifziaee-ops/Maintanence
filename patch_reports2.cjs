const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

code = code.replace(
  /generateReminderLink, generateSmartBillLink/,
  "generateReminderLink, generateSmartBillLink, getOutstandingBreakdown, generateDetailedReminderLink"
);

code = code.replace(
  /const arrears = expectedTotalBefore - totalPaidBefore;/g,
  `const arrears = expectedTotalBefore - totalPaidBefore;
      
      const breakdown = getOutstandingBreakdown(flat, totalPaidBefore, epochYear, epochMonth, selYear, selMonth + 1);`
);

code = code.replace(
  /return \{\n\s*\.\.\.flat,\n\s*arrears\n\s*\};/g,
  `return {
        ...flat,
        arrears,
        breakdown
      };`
);

code = code.replace(
  /generateReminderLink\(flat\.mobile, flat\.ownerName, flat\.flatNumber, flat\.arrears\)/g,
  "generateDetailedReminderLink(flat.mobile, flat.ownerName, flat.flatNumber, flat.arrears, flat.breakdown)"
);

fs.writeFileSync('components/Reports.tsx', code);
