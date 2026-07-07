const selectedMonth = '2026-07';
const startOfNextMonth = new Date(selectedMonth + '-01');
console.log("Original:", startOfNextMonth.toISOString());
console.log("Local:", startOfNextMonth.toString());
startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);
const endOfMonthStr = startOfNextMonth.toISOString().slice(0, 10);
console.log("End:", endOfMonthStr);
