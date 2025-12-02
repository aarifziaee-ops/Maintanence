
import { BUILDING_NAME } from '../constants';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Simple Number to Words for typical amounts (up to 99,999)
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

export const generateWhatsAppLink = (
  mobile: string, 
  receiptNo: number, 
  name: string, 
  flat: string, 
  amount: number, 
  date: string
): string => {
  // Remove non-digit chars from mobile
  const cleanMobile = mobile.replace(/\D/g, '');
  const finalMobile = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;

  const message = `*PAYMENT RECEIPT*\n${BUILDING_NAME}\n\nReceipt No: ${receiptNo}\nDate: ${date}\n\nReceived with thanks from:\nName: *${name}*\nFlat No: *${flat}*\n\nAmount: *Rs. ${amount}*\n(${amountToWords(amount)})\n\nStatus: *PAID*\n\nThank you for your timely payment.`;
  
  return `https://wa.me/${finalMobile}?text=${encodeURIComponent(message)}`;
};

export const downloadSampleCsv = () => {
  const headers = "FlatNumber,OwnerName,Mobile";
  const rows = [
    "B-0801,Amit Kumar,9876543210",
    "B-0802,Sneha Gupta,9988776655",
    "B-0803,Rajesh Verma,9123456780"
  ];
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "flat_details_sample.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
