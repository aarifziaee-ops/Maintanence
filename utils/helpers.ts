
import { BUILDING_NAME, MAINTENANCE_AMOUNT } from '../constants';
import { Flat } from '../types';

export const calculateMaintenanceForMonth = (flat: { isRented?: boolean }, year: number, month: number): number => {
  if (year === 2025 && month === 11) {
    return 500;
  }
  if (year < 2026 || (year === 2026 && month < 4)) {
    return 2000;
  }
  return flat.isRented ? 2800 : 2500;
};

export const calculateExpectedTotalBefore = (flat: { isRented?: boolean }, epochYear: number, epochMonth: number, targetYear: number, targetMonth: number): number => {
  let total = 0;
  let currYear = epochYear;
  let currMonth = epochMonth;
  
  while (currYear < targetYear || (currYear === targetYear && currMonth < targetMonth)) {
    total += calculateMaintenanceForMonth(flat, currYear, currMonth);
    currMonth++;
    if (currMonth > 12) {
      currMonth = 1;
      currYear++;
    }
  }
  return total;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatMonthYear = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  try {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return '';
  }
};

const MONTHS_LONG = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export const getTransactionsForMonth = (transactions: any[], targetMonthStr: string): any[] => {
  // targetMonthStr is YYYY-MM
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
    
    // Default to transaction date if no month specified in remarks
    if (t.date && t.date.startsWith(targetMonthStr)) return true;

    return false;
  });
};

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const amountToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString().length > 9 ? parseFloat(num.toString().substring(0, 9)) : num) === 0) return '';

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';

  return str.trim() + ' Only';
};

const getCleanLocalMobile = (mobile: string): string => {
  if (!mobile) return '';
  let clean = mobile.replace(/\D/g, '');
  if (clean.length === 10) return '91' + clean;
  if (clean.length === 11 && clean.startsWith('0')) return '91' + clean.substring(1);
  if (clean.length === 12 && clean.startsWith('91')) return clean;
  if (clean.length > 10) return '91' + clean.slice(-10);
  return clean;
};

export const generateWhatsAppLink = (
  mobile: string, 
  receiptNo: number, 
  name: string, 
  flat: string, 
  amount: number, 
  date: string
): string => {
  const cleanMobile = getCleanLocalMobile(mobile);
  if (!cleanMobile) return '#';
  const message = `*PAYMENT RECEIPT*\n${BUILDING_NAME}\n\nReceipt No: ${receiptNo}\nDate: ${date}\n\nReceived with thanks from:\nName: *${name}*\nFlat No: *${flat}*\n\nAmount: *Rs. ${amount}*\n(${amountToWords(amount)})\n\nStatus: *PAID*\n\nThank you for your timely payment.`;
  return `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
};


export const getOutstandingBreakdown = (
  flat: { id: string, isRented?: boolean }, 
  transactions: any[], 
  epochYear: number, 
  epochMonth: number, 
  targetYear: number, 
  targetMonth: number
): { monthName: string, amount: number, year: number }[] => {
  let currYear = epochYear;
  let currMonth = epochMonth;
  const breakdown: { monthName: string, amount: number, year: number }[] = [];
  
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  while (currYear < targetYear || (currYear === targetYear && currMonth < targetMonth)) {
    // Format YYYY-MM
    const monthStr = `${currYear}-${currMonth.toString().padStart(2, '0')}`;
    const monthTransactions = getTransactionsForMonth(transactions, monthStr);
    
    // If they have ANY transaction for this month, consider it paid.
    // This perfectly matches the logic of the "Pending" page month-wise.
    const hasPaid = monthTransactions.some(t => t.flatId === flat.id);
    
    if (!hasPaid) {
      const monthlyDue = calculateMaintenanceForMonth(flat, currYear, currMonth);
      breakdown.push({
        monthName: MONTHS_LONG[currMonth - 1],
        amount: monthlyDue,
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
  
  let breakdownText = breakdown.map(b => `${b.monthName} ${b.amount}`).join('\n');
  
  const message = `Dear ${name || 'Member'},\n\nFlat: *${flat}*\n\nYour maintenance payment for *Continental Heights B Wing* is pending.\n\nOutstanding Breakdown:\n${breakdownText}\n\nTotal Amount: *Rs. ${totalAmount}*\n\nPlease pay at your earliest convenience.\n\nThank you.`;
  return `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
};

export const generateReminderLink = (mobile: string, name: string, flat: string, amount: number = MAINTENANCE_AMOUNT): string => {
  const cleanMobile = getCleanLocalMobile(mobile);
  if (!cleanMobile) return '#';
  const message = `Dear ${name || 'Member'},\n\nFlat: *${flat}*\n\nYour maintenance payment for *${BUILDING_NAME}* is pending.\nAmount: *Rs. ${amount}*\n\nPlease pay at your earliest convenience.\n\nThank you.`;
  return `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
};

export const generateSmartBillLink = (
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
     const breakdownText = breakdown.map(b => `${b.monthName} ${b.year} Rs. ${b.amount}`).join(', ');
     arrearsText = `\nPrevious Arrears: *Rs. ${arrears}* (Pending: ${breakdownText})`;
  } else if (arrears > 0) {
     arrearsText = `\nPrevious Arrears: *Rs. ${arrears}*`;
  } else if (arrears < 0) {
     arrearsText = `\nAdvance Balance: *Rs. ${Math.abs(arrears)}*`;
  }
    
  const message = `*MAINTENANCE BILL*\n${BUILDING_NAME}\n\nDear ${name || 'Member'},\n\nYour maintenance bill for *${monthStr}* has been generated for Flat *${flat}*.\n\nCurrent Month: *Rs. ${current}*${arrearsText}\n*Total Payable: Rs. ${total}*\n\nPlease pay by the 10th of every month so that we can run the services of the building.\n\nSociety office timing is from 8:00 PM to 10:00 PM.\n\nThank you.`;
  
  return `https://wa.me/${cleanMobile}?text=${encodeURIComponent(message)}`;
};

export const downloadPDF = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Use html2pdf library if available (it is linked in index.html)
  if (typeof (window as any).html2pdf !== 'undefined') {
    const opt = {
      margin: [0.5, 0.5],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false 
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    (window as any).html2pdf().from(element).set(opt).save();
  } else {
    // Fallback to print if library is not ready
    const originalTitle = document.title;
    document.title = filename.replace(/\.pdf$/i, '');
    window.print();
    document.title = originalTitle;
  }
};

/**
 * Downloads a sample CSV for bulk updating flat owner details.
 */
export const downloadSampleCsv = () => {
  const csvContent = "Flat Number,Owner Name,Mobile\nB-0801,Mangesh Chindarkar,9769915542\nB-0802,Dattaram Babu Birambole,8102520482";
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "flat_update_sample.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads a sample CSV for bulk importing outstanding maintenance.
 */
export const downloadOutstandingSampleCsv = () => {
  const csvContent = "Flat,Nov-25,Dec-25,Jan-26,Feb-26,Mar-26,Apr-26,May-26,Jun-26,Jul-26,TOTAL\nB-0904,-,-,2000,2000,2000,2800,2800,2800,2800,17200\nB-1101,-,-,-,-,-,-,-,2800,2800,5600";
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "outstanding_template.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads a sample CSV for bulk importing historical transactions.
 */
export const downloadTransactionSampleCsv = () => {
  const csvContent = "Date,Flat Number,Amount,Receipt No,Owner Name\n2023-10-01,B-0801,2000,101,Mangesh Chindarkar";
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "transaction_import_sample.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads a sample CSV for bulk importing financial records (income/expense).
 */
export const downloadFinanceSampleCsv = () => {
  const csvContent = "Date,Type,Amount,Category,Description,Mode\n2023-10-05,EXPENSE,500,Utilities,Water Bill,BANK\n2023-10-06,INCOME,1500,Other,Late Fees,CASH";
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "finance_import_sample.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
