const MONTHS_LONG = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const getTransactionsForMonth = (transactions, targetMonthStr) => {
  const d = new Date(targetMonthStr + '-01');
  const targetMonthIndex = d.getMonth();
  
  const targetMonthLong = MONTHS_LONG[targetMonthIndex];
  const targetMonthShort = MONTHS_SHORT[targetMonthIndex];
  
  const targetMonthNumStr = (targetMonthIndex + 1).toString().padStart(2, '0');
  const targetYearStr = d.getFullYear().toString();
  const targetShortYear = targetYearStr.slice(-2);
  const targetMonthRegex = new RegExp(`\\b(${targetMonthLong}|${targetMonthShort})\\b`, 'i');

  return transactions.filter(t => {
    let explicitlyMatchesTarget = false;
    let explicitlyMatchesOther = false;

    if (t.remarks) {
       const rm = t.remarks.toLowerCase();
       
       if (rm.includes(targetMonthLong) || targetMonthRegex.test(rm) || 
           rm.includes(`${targetMonthShort}${targetYearStr}`) || rm.includes(`${targetMonthShort}${targetShortYear}`) ||
           rm.includes(targetMonthStr) || rm.includes(`${targetMonthNumStr}/${targetYearStr}`) || 
           rm.includes(`${targetMonthNumStr}-${targetYearStr}`) || rm.includes(`${targetMonthNumStr}/${targetShortYear}`) || 
           rm.includes(`${targetMonthNumStr}-${targetShortYear}`)) {
           explicitlyMatchesTarget = true;
       }
       
       if (!explicitlyMatchesTarget) {
          for (let i = 0; i < 12; i++) {
             if (i === targetMonthIndex) continue;
             const otherM = MONTHS_LONG[i];
             const otherS = MONTHS_SHORT[i];
             const otherRegex = new RegExp(`\\b(${otherM}|${otherS})\\b`, 'i');
             const otherNumStr = (i + 1).toString().padStart(2, '0');
             
             if (rm.includes(otherM) || otherRegex.test(rm) || 
                 rm.includes(`${otherS}${targetYearStr}`) || rm.includes(`${otherS}${targetShortYear}`) ||
                 rm.includes(`${targetYearStr}-${otherNumStr}`) || rm.includes(`${otherNumStr}/${targetYearStr}`) || 
                 rm.includes(`${otherNumStr}-${targetYearStr}`) || rm.includes(`${otherNumStr}/${targetShortYear}`) || 
                 rm.includes(`${otherNumStr}-${targetShortYear}`)) {
                 explicitlyMatchesOther = true;
                 break;
             }
          }
       }
    }

    if (explicitlyMatchesTarget) return true;
    if (explicitlyMatchesOther) return false;
    
    if (t.date && t.date.startsWith(targetMonthStr)) return true;

    return false;
  });
};

const txs = [
  { date: '2026-05-04', remarks: 'Nov 2025: 500, Dec 2025: 2000, Jan 2026: 2000' }
];

console.log('Nov 2025', getTransactionsForMonth(txs, '2025-11').length);
console.log('Dec 2025', getTransactionsForMonth(txs, '2025-12').length);
console.log('Jan 2026', getTransactionsForMonth(txs, '2026-01').length);
console.log('Feb 2026', getTransactionsForMonth(txs, '2026-02').length);
