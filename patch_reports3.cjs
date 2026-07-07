const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

const replacement = `
    // User requested starting from November 2025
    const epochYear = 2025;
    const epochMonth = 11;
    
    let totalOutstanding = 0;
    
    const outstandingData = state.flats.map(flat => {
      const breakdown = getOutstandingBreakdown(flat, state.transactions, epochYear, epochMonth, selYear, selMonth);
      const arrears = breakdown.reduce((sum, b) => sum + b.amount, 0);
      
      return {
        ...flat,
        arrears,
        breakdown
      };
    }).filter(f => f.arrears > 0).sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
`;

code = code.replace(
  /\s*const epochYear = 2026;\n\s*const epochMonth = 4;\n[\s\S]*?\.filter\(f => f\.arrears > 0\)\.sort\(\(a, b\) => a\.flatNumber\.localeCompare\(b\.flatNumber\)\);/,
  replacement
);

fs.writeFileSync('components/Reports.tsx', code);
