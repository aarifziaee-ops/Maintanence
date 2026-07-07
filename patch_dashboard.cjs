const fs = require('fs');
let code = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

code = code.replace(
  /const EPOCH_YEAR = 2026;\n\s*const EPOCH_MONTH = 4;\n\s*state\.flats\.forEach\(flat => \{\n\s*const expectedTotalBefore = calculateExpectedTotalBefore\(flat, EPOCH_YEAR, EPOCH_MONTH, targetYear, targetMonth\);\n\s*const totalPaidBefore = state\.transactions\n\s*\.filter\(t => t\.flatId === flat\.id && t\.date < selectedMonth \+ '-01'\)\n\s*\.reduce\(\(sum, t\) => sum \+ t\.amount, 0\);\n\s*const arrears = Math\.max\(0, expectedTotalBefore - totalPaidBefore\);/,
  `const EPOCH_YEAR = 2025;
    const EPOCH_MONTH = 11;
    state.flats.forEach(flat => {
        // Use the new breakdown logic for consistency
        const pastTransactions = state.transactions.filter(t => t.date < selectedMonth + '-01');
        const breakdown = getOutstandingBreakdown(flat, pastTransactions, EPOCH_YEAR, EPOCH_MONTH, targetYear, targetMonth);
        const arrears = breakdown.reduce((sum, b) => sum + b.amount, 0);`
);

code = code.replace(
  /calculateExpectedTotalBefore } from '\.\.\/utils\/helpers';/,
  "calculateExpectedTotalBefore, getOutstandingBreakdown } from '../utils/helpers';"
);

fs.writeFileSync('components/Dashboard.tsx', code);
