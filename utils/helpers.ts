
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

const MONTH_NAME_TO_INDEX: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12'
};

const remarksMonthCache = new Map<string, string[]>();

export const parseMonthsFromRemarks = (remarks: string | undefined, dateStr: string): string[] => {
  const cacheKey = `${dateStr || ''}_${remarks || ''}`;
  if (remarksMonthCache.has(cacheKey)) {
    return remarksMonthCache.get(cacheKey)!;
  }

  if (!remarks || !remarks.trim()) {
    const res = [dateStr ? dateStr.substring(0, 7) : new Date().toISOString().substring(0, 7)];
    remarksMonthCache.set(cacheKey, res);
    return res;
  }

  const rm = remarks.toLowerCase();

  if (rm.includes('[') && rm.includes(']')) {
    const res = [dateStr ? dateStr.substring(0, 7) : new Date().toISOString().substring(0, 7)];
    remarksMonthCache.set(cacheKey, res);
    return res;
  }

  const yearMatches = rm.match(/\b(20\d\d)\b/g);
  let defaultYear = dateStr ? dateStr.substring(0, 4) : new Date().getFullYear().toString();
  if (yearMatches && yearMatches.length > 0) {
    defaultYear = yearMatches[yearMatches.length - 1];
  }

  const foundMonths: string[] = [];
  const monthNamesRegex = /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\b/gi;
  let match;
  while ((match = monthNamesRegex.exec(rm)) !== null) {
    const monthKey = match[1].toLowerCase();
    const monthNum = MONTH_NAME_TO_INDEX[monthKey];
    if (monthNum) {
      foundMonths.push(`${defaultYear}-${monthNum}`);
    }
  }

  if (foundMonths.length > 0) {
    const uniqueMonths = Array.from(new Set(foundMonths)).sort();
    remarksMonthCache.set(cacheKey, uniqueMonths);
    return uniqueMonths;
  }

  const res = [dateStr ? dateStr.substring(0, 7) : new Date().toISOString().substring(0, 7)];
  remarksMonthCache.set(cacheKey, res);
  return res;
};

export const getTransactionsForMonth = (transactions: any[], targetMonthStr: string): any[] => {
  if (!transactions || !Array.isArray(transactions)) return [];
  return transactions.filter(t => {
    const months = parseMonthsFromRemarks(t.remarks, t.date);
    return months.includes(targetMonthStr);
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
  
  const flatPaidMonths = new Set<string>();
  if (transactions && transactions.length > 0) {
    transactions.forEach(t => {
      if (t.flatId === flat.id) {
        const months = parseMonthsFromRemarks(t.remarks, t.date);
        months.forEach(m => flatPaidMonths.add(m));
      }
    });
  }

  while (currYear < targetYear || (currYear === targetYear && currMonth < targetMonth)) {
    // Format YYYY-MM
    const monthStr = `${currYear}-${currMonth.toString().padStart(2, '0')}`;
    const hasPaid = flatPaidMonths.has(monthStr);
    
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
    
  const currentText = current > 0 ? `Rs. ${current}` : 'Rs. 0 (Already Paid)';
  const message = `*MAINTENANCE BILL*\n${BUILDING_NAME}\n\nDear ${name || 'Member'},\n\nYour maintenance bill for *${monthStr}* has been generated for Flat *${flat}*.\n\nCurrent Month: *${currentText}*${arrearsText}\n*Total Payable: Rs. ${total}*\n\nPlease pay by the 10th of every month so that we can run the services of the building.\n\nSociety office timing is from 8:00 PM to 10:00 PM.\n\nThank you.`;
  
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
