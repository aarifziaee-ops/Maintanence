const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

code = code.replace(
  /\}\)\.filter\(f => f\.arrears > 0\)\.sort\(\(a, b\) => a\.flatNumber\.localeCompare\(b\.flatNumber\)\);/g,
  "}).filter(f => f.arrears > 0).sort((a, b) => b.arrears - a.arrears);"
);

fs.writeFileSync('components/Reports.tsx', code);
