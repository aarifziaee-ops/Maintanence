const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

const oldBilling = `    // Assuming billing starts from Jan 2026
    const epochYear = 2026;
    const epochMonth = 1;
    
    const [selYearStr, selMonthStr] = billingMonth.split('-');
    const selYear = parseInt(selYearStr);
    const selMonth = parseInt(selMonthStr);
    
    return state.flats.map(flat => {
      // Number of months passed from Jan 2026 up to (but not including) the selected billing month
      // Use the utility to calculate taking historical rates and rent status into account.
      const expectedTotalBefore = calculateExpectedTotalBefore(flat, epochYear, epochMonth, selYear, selMonth);
      
      // Calculate total paid by this flat BEFORE the selected billing month
      const totalPaidBefore = state.transactions
        .filter(t => t.flatId === flat.id && t.date.slice(0, 7) < billingMonth)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const previousArrears = expectedTotalBefore - totalPaidBefore;`;

const newBilling = `    // User requested starting from November 2025
    const epochYear = 2025;
    const epochMonth = 11;
    
    const [selYearStr, selMonthStr] = billingMonth.split('-');
    const selYear = parseInt(selYearStr);
    const selMonth = parseInt(selMonthStr);
    
    return state.flats.map(flat => {
      // Filter transactions BEFORE the selected billing month
      const pastTransactions = state.transactions.filter(t => t.date.slice(0, 7) < billingMonth);
      
      const breakdown = getOutstandingBreakdown(flat, pastTransactions, epochYear, epochMonth, selYear, selMonth);
      const previousArrears = breakdown.reduce((sum, b) => sum + b.amount, 0);`;

code = code.replace(oldBilling, newBilling);

fs.writeFileSync('components/Reports.tsx', code);
