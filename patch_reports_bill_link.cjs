const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

code = code.replace(
  "totalPayable\n      };",
  "totalPayable,\n        breakdown\n      };"
);

code = code.replace(
  "generateSmartBillLink(flat.mobile, flat.ownerName, flat.flatNumber, formattedMonth, flat.currentMonthDue, flat.previousArrears, flat.totalPayable)",
  "generateSmartBillLink(flat.mobile, flat.ownerName, flat.flatNumber, formattedMonth, flat.currentMonthDue, flat.previousArrears, flat.totalPayable, flat.breakdown)"
);

fs.writeFileSync('components/Reports.tsx', code);
