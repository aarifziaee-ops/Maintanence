
import React, { useMemo, useState } from 'react';
import { AppState, PaymentStatus, Transaction } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink, getTodayDateString, generateReminderLink, generateSmartBillLink, getOutstandingBreakdown, generateDetailedReminderLink, downloadPDF, calculateExpectedTotalBefore, calculateMaintenanceForMonth, getTransactionsForMonth, parseMonthsFromRemarks } from '../utils/helpers';
import { Users, Clock, AlertCircle, Share2, Edit2, Calendar, Download, MessageCircle, FileText, CheckCircle2, CalendarDays, ChevronLeft, ChevronRight, Copy, FileSpreadsheet, Sparkles } from 'lucide-react';
import { MAINTENANCE_AMOUNT } from '../constants';

interface ReportsProps {
  state: AppState;
  view: 'REPORTS' | 'UNPAID_LIST';
  refreshState?: (newState: AppState) => void;
  onEditTransaction?: (tx: Transaction) => void;
}


const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear().toString().slice(2)}`;
};

const Reports: React.FC<ReportsProps> = ({ state, view, refreshState, onEditTransaction }) => {
  const [activeTab, setActiveTab] = useState<'DAILY' | 'UNPAID' | 'OUTSTANDING' | 'AUDIT' | 'BILLING' | 'BANK_TRANSFER' | 'OWNERS' | 'TENANTS' | 'ADVANCE'>(view === 'UNPAID_LIST' ? 'UNPAID' : 'DAILY');
  
  // Date Range State for Collection Report
  const [fromDate, setFromDate] = useState<string>(getTodayDateString());
  const [toDate, setToDate] = useState<string>(getTodayDateString());

  // Month State for Unpaid Report
  const [unpaidMonth, setUnpaidMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Month State for Billing Report
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Month State for Advance Report
  const [advanceMonth, setAdvanceMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Year State for Audit Report
  const [auditYear, setAuditYear] = useState(new Date().getFullYear().toString());

  // Month State for Bank Transfer Report
  const [bankTransferMonth, setBankTransferMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Copy State
  const [copied, setCopied] = useState(false);

  const handlePrevMonth = () => {
    const d = new Date(unpaidMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setUnpaidMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const d = new Date(unpaidMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setUnpaidMonth(d.toISOString().slice(0, 7));
  };
  
  const handlePrevBillingMonth = () => {
    const d = new Date(billingMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setBillingMonth(d.toISOString().slice(0, 7));
  };

  const handleNextBillingMonth = () => {
    const d = new Date(billingMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setBillingMonth(d.toISOString().slice(0, 7));
  };

  const handlePrevAdvanceMonth = () => {
    const d = new Date(advanceMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setAdvanceMonth(d.toISOString().slice(0, 7));
  };

  const handleNextAdvanceMonth = () => {
    const d = new Date(advanceMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setAdvanceMonth(d.toISOString().slice(0, 7));
  };

  const handlePrevBankTransferMonth = () => {
    const d = new Date(bankTransferMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setBankTransferMonth(d.toISOString().slice(0, 7));
  };

  const handleNextBankTransferMonth = () => {
    const d = new Date(bankTransferMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setBankTransferMonth(d.toISOString().slice(0, 7));
  };

  const rangeReport = useMemo(() => {
    if (!fromDate || !toDate) return [];
    return [...state.transactions].filter(t => {
      const txDate = t.date.split('T')[0];
      return txDate >= fromDate && txDate <= toDate;
    }).sort((a, b) => b.receiptNo - a.receiptNo);
  }, [state.transactions, fromDate, toDate]);

  const rangeTotal = rangeReport.reduce((acc, curr) => acc + curr.amount, 0);

  // Filter flats that have NOT paid in the selected month
  const unpaidFlats = useMemo(() => {
    return state.flats.filter(flat => {
      const hasOutstandingInDb = state.outstandingBalances?.some(
        (ob) => ob.flatId === flat.id && ob.month === unpaidMonth
      );
      return hasOutstandingInDb;
    });
  }, [state.flats, state.outstandingBalances, unpaidMonth]);

  // Calculate Billing Data
  const billingData = useMemo(() => {
    const [selYearStr, selMonthStr] = billingMonth.split('-');
    const selYear = parseInt(selYearStr, 10);
    const selMonth = parseInt(selMonthStr, 10);
    
    return state.flats.map(flat => {
      // Find all outstanding balances for this flat from state.outstandingBalances that are BEFORE the selected billingMonth (YYYY-MM)
      const flatOutstanding = state.outstandingBalances?.filter((ob) => (ob.flatId === flat.id || ob.flatId === flat.flatNumber) && ob.month < billingMonth) || [];
      
      const breakdown = flatOutstanding.map((ob) => {
        const [yearStr, monthStr] = ob.month.split('-');
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10) - 1;
        const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return {
          monthName: MONTHS_LONG[monthIndex],
          amount: ob.amount,
          year: year
        };
      });
      
      const previousArrears = flatOutstanding.reduce((sum, ob) => sum + ob.amount, 0);

      // Check if billingMonth has already been paid for this flat (either in advance or on time)
      const isBillingMonthPaid = state.transactions.some(t => 
        (t.flatId === flat.id || t.flatNumber === flat.flatNumber) && 
        parseMonthsFromRemarks(t.remarks, t.date).includes(billingMonth)
      );

      const billingMonthOb = state.outstandingBalances?.find(ob => (ob.flatId === flat.id || ob.flatId === flat.flatNumber) && ob.month === billingMonth);

      let currentMonthDue = 0;
      if (isBillingMonthPaid) {
        currentMonthDue = 0;
      } else if (billingMonthOb) {
        currentMonthDue = billingMonthOb.amount;
      } else {
        currentMonthDue = calculateMaintenanceForMonth(flat, selYear, selMonth);
      }

      const totalPayable = previousArrears + currentMonthDue;
      
      return {
        ...flat,
        previousArrears,
        currentMonthDue,
        totalPayable,
        isBillingMonthPaid,
        breakdown
      };
    }).sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
  }, [state.flats, state.outstandingBalances, state.transactions, billingMonth]);

  const advanceReport = useMemo(() => {
    const result: {
      transaction: Transaction;
      flatNumber: string;
      ownerName: string;
      mobile: string;
      paymentDate: string;
      advanceMonthsStr: string;
      advanceAmount: number;
    }[] = [];

    state.transactions.forEach(t => {
      const paymentMonthStr = t.date.substring(0, 7);
      if (paymentMonthStr === advanceMonth) {
        const coveredMonths = parseMonthsFromRemarks(t.remarks, t.date);
        const advMonths = coveredMonths.filter(m => m > paymentMonthStr);
        
        if (advMonths.length > 0) {
          const flat = state.flats.find(f => f.id === t.flatId || f.flatNumber === t.flatNumber);
          const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const advLabels = advMonths.map(mStr => {
            const [yr, mIndexStr] = mStr.split('-');
            const mIdx = parseInt(mIndexStr, 10) - 1;
            return `${MONTHS_LONG[mIdx]} ${yr}`;
          });

          const prop = coveredMonths.length > 0 ? (advMonths.length / coveredMonths.length) : 1;
          const advAmount = Math.round(t.amount * prop);

          result.push({
            transaction: t,
            flatNumber: t.flatNumber || (flat ? flat.flatNumber : ''),
            ownerName: t.ownerName || (flat ? flat.ownerName : ''),
            mobile: t.mobile || (flat ? (flat.mobile || '') : ''),
            paymentDate: t.date,
            advanceMonthsStr: advLabels.join(', '),
            advanceAmount: advAmount > 0 ? advAmount : t.amount
          });
        }
      }
    });

    return result.sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
  }, [state.transactions, state.flats, advanceMonth]);

  const totalAdvanceAmount = useMemo(() => {
    return advanceReport.reduce((sum, item) => sum + item.advanceAmount, 0);
  }, [advanceReport]);

  const bankTransferData = useMemo(() => {
    return state.transactions.filter(t => 
      t.date.startsWith(bankTransferMonth) && t.paymentMode === 'BANK'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.transactions, bankTransferMonth]);

  const handleDownload = () => {
    let fileName = '';
    if (activeTab === 'DAILY') fileName = `Collection_Report_${fromDate}_to_${toDate}.pdf`;
    else if (activeTab === 'UNPAID') fileName = `Unpaid_List_${unpaidMonth}.pdf`;
    else if (activeTab === 'BILLING') fileName = `Demand_Notice_${billingMonth}.pdf`;
    else if (activeTab === 'BANK_TRANSFER') fileName = `Bank_Transfer_Report_${bankTransferMonth}.pdf`;
    else fileName = `Audit_Report_${auditYear}.pdf`;
    
    // Explicitly target the printable-section container
    downloadPDF('printable-section', fileName);
  };

  const copyBroadcastNumbers = () => {
    const numbers = unpaidFlats
      .filter(f => f.mobile)
      .map(f => {
        let clean = f.mobile!.replace(/\D/g, '');
        if (clean.length === 10) clean = '91' + clean;
        return clean;
      })
      .join(', ');
    
    if (numbers) {
      navigator.clipboard.writeText(numbers);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert("No valid mobile numbers found for unpaid flats.");
    }
  };

  const auditData = useMemo(() => {
    // Income from maintenance
    const maintenanceIncome = state.transactions
      .filter(t => t.date.startsWith(auditYear))
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Income from hall bookings
    const hallIncome = (state.hallBookings || [])
      .filter(h => h.bookingDate.startsWith(auditYear))
      .reduce((sum, h) => sum + h.amount, 0);
      
    // Other income
    const otherIncomeRecords = state.financialRecords.filter(r => r.type === 'INCOME' && r.date.startsWith(auditYear));
    const otherIncomeTotal = otherIncomeRecords.reduce((sum, r) => sum + r.amount, 0);
    
    const totalIncome = maintenanceIncome + hallIncome + otherIncomeTotal;
    
    // Expenses grouped by category (excluding VENDOR_BILL as they are tracked via EXPENSE payments)
    const expenses = state.financialRecords.filter(r => r.type === 'EXPENSE' && r.date.startsWith(auditYear));
    const expenseGroups = expenses.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.amount;
        return acc;
    }, {} as Record<string, number>);
    
    const totalExpense = expenses.reduce((sum, r) => sum + r.amount, 0);

    return { maintenanceIncome, hallIncome, otherIncomeRecords, otherIncomeTotal, totalIncome, expenseGroups, totalExpense };
  }, [state.transactions, state.hallBookings, state.financialRecords, auditYear]);

  const renderDailyReport = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Collection Report</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Custom Period</p>
          </div>
          <button 
            onClick={handleDownload} 
            className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>

        {/* PRINT HEADER */}
        <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
            <h2 className="text-lg font-bold text-black uppercase">
              Collection Report
            </h2>
            <p className="text-sm text-black font-medium">
              Period: {formatDate(fromDate)} to {formatDate(toDate)}
            </p>
        </div>

        {/* DATE PICKERS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print transition-colors">
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black mb-1.5 block ml-1">From Date</label>
                <div className="relative">
                  <CalendarDays size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
             </div>
             <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black mb-1.5 block ml-1">To Date</label>
                <div className="relative">
                  <CalendarDays size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
             </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div>
               <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Receipts Issued</span>
               <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{rangeReport.length} Receipts</span>
             </div>
             <div className="text-right">
               <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Total Collection</span>
               <span className="text-2xl font-black text-green-600 dark:text-green-400 tracking-tight">{formatCurrency(rangeTotal)}</span>
             </div>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:shadow-none print:rounded-none">
             <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
                <div className="w-10 shrink-0">No</div>
                <div className="w-20 shrink-0">Date</div>
                <div className="w-16 shrink-0">Flat</div>
                <div className="flex-1 px-2">Owner / Remarks</div>
                <div className="w-20 shrink-0 text-right">Amount</div>
                <div className="w-10 shrink-0 text-center no-print"></div>
             </div>
             
             <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                {rangeReport.length === 0 ? (
                   <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">No transactions found for this period.</div>
                ) : rangeReport.map((t) => (
                  <div key={`${t.receiptNo}-${t.date}-${t.timestamp || t.amount}`} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2">
                    <div className="w-10 shrink-0 font-mono text-slate-400 dark:text-slate-500 print:text-black">#{t.receiptNo}</div>
                    <div className="w-20 shrink-0 text-slate-500 dark:text-slate-400 print:text-black">{formatShortDate(t.date)}</div>
                    <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{t.flatNumber}</div>
                    <div className="flex-1 px-2 break-words text-slate-600 dark:text-slate-300 print:text-black font-medium">
                      {t.ownerName}
                      {t.remarks && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{t.remarks}</div>}
                    </div>
                    <div className="w-20 shrink-0 text-right font-black text-slate-900 dark:text-white print:text-black">
                        {formatCurrency(t.amount)}
                    </div>
                    <div className="w-20 shrink-0 flex justify-end space-x-1 no-print">
                        {onEditTransaction && (
                          <button 
                            onClick={() => onEditTransaction(t)}
                            className="text-blue-600 dark:text-blue-400 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View/Edit Receipt"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        <a href={generateWhatsAppLink(t.mobile, t.receiptNo, t.ownerName, t.flatNumber, t.amount, formatDate(t.date))} target="_blank" rel="noreferrer" className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                            <Share2 size={14} />
                        </a>
                    </div>
                  </div>
                ))}
                
                {rangeReport.length > 0 && (
                   <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                      <div className="flex-1 text-right font-black uppercase text-[10px] tracking-widest text-slate-400 dark:text-slate-500 print:text-black">
                        Total {rangeReport.length} Receipts Issued
                      </div>
                      <div className="w-20 text-right font-black text-slate-900 dark:text-white print:text-black ml-2">{formatCurrency(rangeTotal)}</div>
                      <div className="w-10 no-print"></div>
                   </div>
                )}
             </div>
        </div>
        
        {/* PRINT FOOTER */}
        <div className="hidden print:block mt-20">
            <div className="flex justify-between px-10">
                <div className="text-center">
                    <div className="w-32 border-t border-black mb-1"></div>
                    <p className="text-xs font-bold uppercase">Treasurer Signature</p>
                </div>
                <div className="text-center">
                    <div className="w-32 border-t border-black mb-1"></div>
                    <p className="text-xs font-bold uppercase">Chairman Signature</p>
                </div>
            </div>
            <p className="text-center text-[8px] text-slate-500 mt-10">Document generated by Continental Heights B Wing Manager App on {new Date().toLocaleString()}</p>
        </div>
    </div>
  );

  const renderUnpaidList = () => {
    const totalPendingAmountForMonth = unpaidFlats.reduce((sum, flat) => {
        const monthYear = unpaidMonth.split('-');
        return sum + calculateMaintenanceForMonth(flat, parseInt(monthYear[0]), parseInt(monthYear[1]));
    }, 0);

    return (
    <div className="space-y-6">
       <div className="flex justify-between items-center no-print">
        <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pending Payments</h2>
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{unpaidFlats.length}</span>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={copyBroadcastNumbers}
                className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
                title="Copy all numbers for WhatsApp Broadcast"
            >
                {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Numbers'}</span>
            </button>
            <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
                <Download size={14} />
                <span className="hidden sm:inline">Export PDF</span>
            </button>
        </div>
       </div>

       {/* Month Selector for Unpaid */}
       <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print">
            <button onClick={handlePrevMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div className="text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Month</span>
                <span className="font-bold text-slate-800 dark:text-white uppercase">{new Date(unpaidMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
            </div>
            <button onClick={handleNextMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
       </div>

       <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
            <h2 className="text-lg font-bold text-black uppercase">PENDING PAYMENTS</h2>
            <p className="text-sm text-black">Month: {new Date(unpaidMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
       </div>

       <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
        <div className="flex items-center bg-black p-4 border-b border-black text-[10px] font-black text-white uppercase tracking-widest">
           <div className="w-20 shrink-0">Flat</div>
           <div className="flex-1 px-2">Owner</div>
           <div className="w-24 shrink-0 text-right">Amount</div>
           <div className="w-10 shrink-0 text-center no-print"></div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
          {unpaidFlats.map(flat => (
            <div key={flat.id} className="flex items-center p-4 text-xs">
               <div className="w-20 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
               <div className="flex-1 px-2 break-words text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
               <div className="w-24 shrink-0 text-right font-black text-red-600 dark:text-red-400 print:text-black">
                  {formatCurrency(calculateMaintenanceForMonth(flat, parseInt(unpaidMonth.split('-')[0]), parseInt(unpaidMonth.split('-')[1])))}
               </div>
               <div className="w-10 shrink-0 flex justify-center no-print">
                   {flat.mobile && (
                     <a href={generateReminderLink(flat.mobile, flat.ownerName, flat.flatNumber, calculateMaintenanceForMonth(flat, parseInt(unpaidMonth.split('-')[0]), parseInt(unpaidMonth.split('-')[1])))} target="_blank" rel="noreferrer" className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Send WhatsApp Reminder">
                        <MessageCircle size={18} />
                     </a>
                   )}
               </div>
            </div>
          ))}

          {unpaidFlats.length > 0 && (
             <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                <div className="flex-1 text-right font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 print:text-black">Total Pending</div>
                <div className="w-24 shrink-0 text-right font-black text-red-600 dark:text-red-400 text-sm print:text-black pl-2">
                   {formatCurrency(totalPendingAmountForMonth)}
                </div>
                <div className="w-10 shrink-0 no-print"></div>
             </div>
          )}

          {unpaidFlats.length === 0 && (
             <div className="p-12 text-center text-slate-400 font-bold italic">Congratulations! No pending payments for {new Date(unpaidMonth + '-01').toLocaleDateString('en-IN', { month: 'long' })}.</div>
          )}
        </div>
       </div>
    </div>
  )};

  const renderAuditReport = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Year-End Audit Report</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Income & Expenditure</p>
          </div>
          <button 
            onClick={handleDownload} 
            className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>

        {/* PRINT HEADER */}
        <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
            <h2 className="text-lg font-bold text-black uppercase">
              Income & Expenditure Statement
            </h2>
            <p className="text-sm text-black font-medium">
              Financial Year: {auditYear}
            </p>
        </div>

        {/* YEAR SELECTOR */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print">
            <button onClick={() => setAuditYear((parseInt(auditYear) - 1).toString())} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div className="text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Year</span>
                <span className="font-bold text-slate-800 dark:text-white text-xl">{auditYear}</span>
            </div>
            <button onClick={() => setAuditYear((parseInt(auditYear) + 1).toString())} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
        </div>

        {/* AUDIT TABLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INCOME SIDE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black">
                    <h3 className="font-black text-green-800 dark:text-green-400 uppercase tracking-widest text-sm print:text-black">Income</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                    <div className="flex justify-between p-4 text-sm">
                        <span className="text-slate-600 dark:text-slate-300 print:text-black">Maintenance Collection</span>
                        <span className="font-bold text-slate-800 dark:text-white print:text-black">{formatCurrency(auditData.maintenanceIncome)}</span>
                    </div>
                    <div className="flex justify-between p-4 text-sm">
                        <span className="text-slate-600 dark:text-slate-300 print:text-black">Hall Bookings</span>
                        <span className="font-bold text-slate-800 dark:text-white print:text-black">{formatCurrency(auditData.hallIncome)}</span>
                    </div>
                    {auditData.otherIncomeRecords.map(r => (
                        <div key={r.id} className="flex justify-between p-4 text-sm">
                            <span className="text-slate-600 dark:text-slate-300 print:text-black">{r.category} {r.description ? `(${r.description})` : ''}</span>
                            <span className="font-bold text-slate-800 dark:text-white print:text-black">{formatCurrency(r.amount)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100 border-t border-slate-200 dark:border-slate-700 print:border-black">
                        <span className="font-black uppercase tracking-widest text-xs text-slate-800 dark:text-white print:text-black">Total Income</span>
                        <span className="font-black text-green-600 dark:text-green-400 print:text-black">{formatCurrency(auditData.totalIncome)}</span>
                    </div>
                </div>
            </div>

            {/* EXPENDITURE SIDE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black">
                    <h3 className="font-black text-red-800 dark:text-red-400 uppercase tracking-widest text-sm print:text-black">Expenditure</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                    {Object.entries(auditData.expenseGroups).length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No expenses recorded.</div>
                    ) : (
                        Object.entries(auditData.expenseGroups).map(([category, amount]) => (
                            <div key={category} className="flex justify-between p-4 text-sm">
                                <span className="text-slate-600 dark:text-slate-300 print:text-black">{category}</span>
                                <span className="font-bold text-slate-800 dark:text-white print:text-black">{formatCurrency(amount)}</span>
                            </div>
                        ))
                    )}
                    <div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100 border-t border-slate-200 dark:border-slate-700 print:border-black">
                        <span className="font-black uppercase tracking-widest text-xs text-slate-800 dark:text-white print:text-black">Total Expenditure</span>
                        <span className="font-black text-red-600 dark:text-red-400 print:text-black">{formatCurrency(auditData.totalExpense)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 print:border-black print:rounded-none">
            <div className="flex justify-between items-center">
                <span className="font-black uppercase tracking-widest text-sm text-slate-800 dark:text-white print:text-black">Surplus / (Deficit)</span>
                <span className={`text-2xl font-black ${auditData.totalIncome >= auditData.totalExpense ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} print:text-black`}>
                    {formatCurrency(auditData.totalIncome - auditData.totalExpense)}
                </span>
            </div>
        </div>
        
        {/* PRINT FOOTER */}
        <div className="hidden print:block mt-20">
            <div className="flex justify-between px-10">
                <div className="text-center">
                    <div className="w-32 border-t border-black mb-1"></div>
                    <p className="text-xs font-bold uppercase">Treasurer Signature</p>
                </div>
                <div className="text-center">
                    <div className="w-32 border-t border-black mb-1"></div>
                    <p className="text-xs font-bold uppercase">Chairman Signature</p>
                </div>
            </div>
            <p className="text-center text-[8px] text-slate-500 mt-10">Document generated by Continental Heights B Wing Manager App on {new Date().toLocaleString()}</p>
        </div>
    </div>
  );

  const renderBillingReport = () => {
    const formattedMonth = new Date(billingMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center no-print">
          <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Demand Notice</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Monthly Billing</p>
          </div>
          <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
          </button>
         </div>

         {/* Month Selector for Billing */}
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print">
              <button onClick={handlePrevBillingMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
              <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Billing Month</span>
                  <span className="font-bold text-slate-800 dark:text-white uppercase">{formattedMonth}</span>
              </div>
              <button onClick={handleNextBillingMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
         </div>

         <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-lg font-bold text-black uppercase">DEMAND NOTICE</h2>
              <p className="text-sm text-black">Billing Month: {formattedMonth}</p>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto print:border-black print:rounded-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest print:bg-slate-100 print:text-black">
                <th className="py-3 px-4 w-20 text-left">Flat</th>
                <th className="py-3 px-4 text-left">Owner</th>
                <th className="py-3 px-4 w-28 text-right">Arrears</th>
                <th className="py-3 px-4 w-28 text-right">Current</th>
                <th className="py-3 px-4 w-32 text-right">Total Due</th>
                <th className="py-3 px-4 w-12 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
              {billingData.map(flat => (
                <tr key={flat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300 print:text-black">{flat.ownerName || '-'}</td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${flat.previousArrears > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'} print:text-black`}>
                    {flat.previousArrears > 0 ? formatCurrency(flat.previousArrears) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300 print:text-black">
                    {flat.isBillingMonthPaid ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">Paid</span>
                    ) : (
                      formatCurrency(flat.currentMonthDue)
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(flat.totalPayable)}
                  </td>
                  <td className="py-3 px-4 text-center no-print">
                    {flat.mobile && (
                      <a 
                        href={generateSmartBillLink(flat.mobile, flat.ownerName, flat.flatNumber, formattedMonth, flat.currentMonthDue, flat.previousArrears, flat.totalPayable, flat.breakdown)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center justify-center text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" 
                        title="Send Smart Bill via WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         </div>
         
         {/* PRINT FOOTER */}
         <div className="hidden print:block mt-20">
             <div className="flex justify-between px-10">
                 <div className="text-center">
                     <div className="w-32 border-t border-black mb-1"></div>
                     <p className="text-xs font-bold uppercase">Treasurer Signature</p>
                 </div>
                 <div className="text-center">
                     <div className="w-32 border-t border-black mb-1"></div>
                     <p className="text-xs font-bold uppercase">Chairman Signature</p>
                 </div>
             </div>
             <p className="text-center text-[8px] text-slate-500 mt-10">Document generated by Continental Heights B Wing Manager App on {new Date().toLocaleString()}</p>
         </div>
      </div>
    );
  };

  const renderAdvanceReport = () => {
    const formattedMonth = new Date(advanceMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Advance Payments Report</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">
              Paid in {formattedMonth} for Future Months
            </p>
          </div>
          <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
            <Download size={14} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>

        {/* Month Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print">
          <button onClick={handlePrevAdvanceMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Payment Month</span>
            <span className="font-bold text-slate-800 dark:text-white uppercase">{formattedMonth}</span>
          </div>
          <button onClick={handleNextAdvanceMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* PRINT HEADER */}
        <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
          <h2 className="text-lg font-bold text-black uppercase">ADVANCE PAYMENTS REPORT</h2>
          <p className="text-sm text-black">Payment Month: {formattedMonth}</p>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center no-print">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Advance Payments</span>
            <span className="text-lg font-black text-slate-800 dark:text-white">{advanceReport.length} Members Paid Advance</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Total Advance Collected</span>
            <span className="text-xl font-black text-green-600 dark:text-green-400">{formatCurrency(totalAdvanceAmount)}</span>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto print:border-black print:shadow-none print:rounded-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest print:bg-slate-100 print:text-black">
                <th className="py-3 px-4 w-16 text-left">Recpt</th>
                <th className="py-3 px-4 w-20 text-left">Flat</th>
                <th className="py-3 px-4 text-left">Owner / Member</th>
                <th className="py-3 px-4 w-24 text-left">Date</th>
                <th className="py-3 px-4 text-left">Advance Months Covered</th>
                <th className="py-3 px-4 w-28 text-right">Advance Amount</th>
                <th className="py-3 px-4 w-12 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
              {advanceReport.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium italic">
                    No advance payments recorded in {formattedMonth}.
                  </td>
                </tr>
              ) : (
                advanceReport.map((item) => (
                  <tr key={item.transaction.id || `${item.transaction.receiptNo}-${item.transaction.date}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-500 print:text-black">#{item.transaction.receiptNo}</td>
                    <td className="py-3 px-4 font-black text-slate-800 dark:text-white print:text-black">{item.flatNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 print:text-black">{item.ownerName}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 print:text-black">{formatShortDate(item.paymentDate)}</td>
                    <td className="py-3 px-4 font-bold text-green-700 dark:text-green-400 print:text-black">
                      {item.advanceMonthsStr}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-green-600 dark:text-green-400 print:text-black">
                      {formatCurrency(item.advanceAmount)}
                    </td>
                    <td className="py-3 px-4 text-center no-print">
                      {item.mobile && (
                        <a 
                          href={generateWhatsAppLink(item.mobile, item.transaction.receiptNo, item.ownerName, item.flatNumber, item.transaction.amount, formatDate(item.paymentDate))} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center justify-center text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="Share Receipt via WhatsApp"
                        >
                          <Share2 size={16} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {advanceReport.length > 0 && (
                <tr className="bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100 font-black">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase text-[10px] tracking-widest text-slate-500 print:text-black">
                    Total Advance Collected ({advanceReport.length} Members)
                  </td>
                  <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 print:text-black">
                    {formatCurrency(totalAdvanceAmount)}
                  </td>
                  <td className="no-print"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PRINT FOOTER */}
        <div className="hidden print:block mt-20">
          <div className="flex justify-between px-10">
            <div className="text-center">
              <div className="w-32 border-t border-black mb-1"></div>
              <p className="text-xs font-bold uppercase">Treasurer Signature</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-t border-black mb-1"></div>
              <p className="text-xs font-bold uppercase">Chairman Signature</p>
            </div>
          </div>
          <p className="text-center text-[8px] text-slate-500 mt-10">Document generated by Continental Heights B Wing Manager App on {new Date().toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const renderOutstandingReport = () => {
    let totalOutstanding = 0;
    
    const outstandingData = state.flats.map(flat => {
      const flatOutstanding = state.outstandingBalances?.filter((ob) => ob.flatId === flat.id) || [];
      
      const breakdown = flatOutstanding.map((ob) => {
        const [yearStr, monthStr] = ob.month.split('-');
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10) - 1;
        const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return {
          monthName: MONTHS_LONG[monthIndex],
          amount: ob.amount,
          year: year
        };
      });
      
      const arrears = flatOutstanding.reduce((sum, ob) => sum + ob.amount, 0);
      
      return {
        ...flat,
        arrears,
        breakdown
      };
    }).filter(f => f.arrears > 0).sort((a, b) => b.arrears - a.arrears);

    totalOutstanding = outstandingData.reduce((sum, f) => sum + f.arrears, 0);
    
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center no-print">
          <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Consolidated Outstanding</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">All Arrears</p>
          </div>
          <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
          </button>
         </div>

         <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-lg font-bold text-black uppercase">CONSOLIDATED OUTSTANDING</h2>
              <p className="text-sm text-black">As of: {new Date().toLocaleDateString('en-IN')}</p>
         </div>
         
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print mb-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Total Outstanding</span>
            <span className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(totalOutstanding)}</span>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
          <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
             <div className="w-16 shrink-0">Flat</div>
             <div className="flex-1 px-2">Owner</div>
             <div className="w-32 shrink-0 text-right">Outstanding</div>
             <div className="w-10 shrink-0 text-center no-print"></div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
            {outstandingData.map(flat => (
              <div key={flat.id} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2">
                 <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
                 <div className="flex-1 px-2 break-words text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
                 <div className="w-32 shrink-0 text-right font-black text-red-600 dark:text-red-400 print:text-black">
                    {formatCurrency(flat.arrears)}
                 </div>
                 <div className="w-10 shrink-0 flex justify-center no-print">
                     {flat.mobile && (
                       <a 
                          href={generateDetailedReminderLink(flat.mobile, flat.ownerName, flat.flatNumber, flat.arrears, flat.breakdown)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" 
                          title="Send Reminder via WhatsApp"
                       >
                          <MessageCircle size={18} />
                       </a>
                     )}
                 </div>
              </div>
            ))}
            {outstandingData.length === 0 && (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold italic">No outstanding payments found.</div>
            )}
            
            <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                <div className="flex-1 text-right font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 print:text-black">Total Outstanding</div>
                <div className="w-32 text-right font-black text-red-600 dark:text-red-400 print:text-black ml-2">{formatCurrency(totalOutstanding)}</div>
                <div className="w-10 no-print"></div>
            </div>
          </div>
         </div>
      </div>
    );
  };
  
  
  const renderDirectory = (type: 'OWNERS' | 'TENANTS') => {
    const isTenants = type === 'TENANTS';
    const title = isTenants ? 'Tenant Directory' : 'Owner Directory';
    const filteredFlats = [...state.flats]
      .filter(f => (isTenants ? f.isRented : !f.isRented))
      .sort((a,b) => a.flatNumber.localeCompare(b.flatNumber));

    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center no-print">
          <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">{filteredFlats.length} Flats</p>
          </div>
          <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
          </button>
         </div>

         <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-lg font-bold text-black uppercase">{title.toUpperCase()}</h2>
         </div>
         
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
          <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
             <div className="w-16 shrink-0">Flat</div>
             <div className="flex-1 px-2">Name</div>
             <div className="w-32 shrink-0">Telephone</div>
             <div className="w-10 shrink-0 text-center no-print"></div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
            {filteredFlats.map(flat => (
              <div key={flat.id} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2">
                 <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
                 <div className="flex-1 px-2 break-words text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
                 <div className="w-32 shrink-0 text-slate-600 dark:text-slate-300 print:text-black font-mono">
                    {flat.mobile || '-'}
                 </div>
                 <div className="w-10 shrink-0 flex justify-center no-print">
                     {flat.mobile && (
                       <a 
                          href={`https://wa.me/${flat.mobile}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" 
                       >
                          <MessageCircle size={18} />
                       </a>
                     )}
                 </div>
              </div>
            ))}
            {filteredFlats.length === 0 && (
               <div className="p-8 text-center text-slate-500 italic">No flats found in this category.</div>
            )}
          </div>
         </div>
      </div>
    );
  };

const renderBankTransferReport = () => {
    const totalBankTransfers = bankTransferData.reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center no-print">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Bank Transfer Report</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Month-wise Details</p>
            </div>
            <button 
              onClick={handleDownload} 
              className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>

          <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-lg font-bold text-black uppercase">
                Bank Transfer Report
              </h2>
              <p className="text-sm text-black font-medium">
                Month: {new Date(bankTransferMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
          </div>

          {/* MONTH PICKER */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print">
              <button onClick={handlePrevBankTransferMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
              <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Month</span>
                  <span className="font-bold text-slate-800 dark:text-white uppercase">{new Date(bankTransferMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </div>
              <button onClick={handleNextBankTransferMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center no-print">
               <span className="text-xs text-slate-400 font-bold uppercase">Total Bank Receipt</span>
               <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{formatCurrency(totalBankTransfers)}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:shadow-none print:rounded-none">
               <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
                  <div className="w-12 shrink-0">Recpt</div>
                  <div className="w-20 shrink-0">Date</div>
                  <div className="w-16 shrink-0">Flat</div>
                  <div className="flex-1 px-2">Owner</div>
                  <div className="w-24 shrink-0 text-right">Amount</div>
               </div>
               
               <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                  {bankTransferData.length === 0 ? (
                     <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">No bank transfers found for this month.</div>
                  ) : bankTransferData.map((t) => (
                    <div key={`${t.receiptNo}-${t.date}-${t.timestamp || t.amount}`} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2 cursor-pointer" onClick={() => onEditTransaction && onEditTransaction(t)}>
                      <div className="w-12 shrink-0 font-mono text-slate-400 dark:text-slate-500 print:text-black">#{t.receiptNo}</div>
                      <div className="w-20 shrink-0 text-slate-500 dark:text-slate-400 print:text-black">{formatShortDate(t.date)}</div>
                      <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{t.flatNumber}</div>
                      <div className="flex-1 px-2 font-medium text-slate-600 dark:text-slate-300 print:text-black break-words">
                        {t.ownerName}
                      </div>
                      <div className="w-24 shrink-0 text-right font-black text-indigo-600 dark:text-indigo-400 print:text-black">
                         {formatCurrency(t.amount)}
                      </div>
                    </div>
                  ))}
               </div>
               
               {bankTransferData.length > 0 && (
                 <div className="hidden print:flex items-center p-4 bg-slate-100 border-t-2 border-black font-black uppercase text-sm">
                   <div className="flex-1 text-right pr-4 tracking-widest">Total Transfer</div>
                   <div className="w-32 text-right">{formatCurrency(totalBankTransfers)}</div>
                 </div>
               )}
          </div>
          
           <div className="hidden print:block mt-20">
               <div className="flex justify-between px-10">
                   <div className="text-center">
                       <div className="w-32 border-t border-black mb-1"></div>
                       <p className="text-xs font-bold uppercase">Treasurer Signature</p>
                   </div>
                   <div className="text-center">
                       <div className="w-32 border-t border-black mb-1"></div>
                       <p className="text-xs font-bold uppercase">Chairman Signature</p>
                   </div>
               </div>
               <p className="text-center text-[8px] text-slate-500 mt-10">Document generated by Continental Heights B Wing Manager App on {new Date().toLocaleString()}</p>
           </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
       <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm no-print transition-colors">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto hide-scrollbar">
             <button onClick={() => setActiveTab('DAILY')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'DAILY' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <FileText size={14} className="mr-2 hidden sm:inline" />
                Collection
             </button>
             
             <button onClick={() => setActiveTab('OUTSTANDING')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'OUTSTANDING' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <AlertCircle size={14} className="mr-2 hidden sm:inline" />
                Outstanding
             </button>
             
             <button onClick={() => setActiveTab('OWNERS')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'OWNERS' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <Users size={14} className="mr-2 hidden sm:inline" />
                Owners
             </button>
             <button onClick={() => setActiveTab('TENANTS')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'TENANTS' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <Users size={14} className="mr-2 hidden sm:inline" />
                Tenants
             </button>


             <button onClick={() => setActiveTab('UNPAID')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'UNPAID' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <AlertCircle size={14} className="mr-2 hidden sm:inline" />
                Pending
             </button>
             <button onClick={() => setActiveTab('BILLING')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'BILLING' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <FileSpreadsheet size={14} className="mr-2 hidden sm:inline" />
                Billing
             </button>
             <button onClick={() => setActiveTab('ADVANCE')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'ADVANCE' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <Sparkles size={14} className="mr-2 hidden sm:inline" />
                Advance
             </button>
             <button onClick={() => setActiveTab('AUDIT')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'AUDIT' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <FileText size={14} className="mr-2 hidden sm:inline" />
                Audit
             </button>
             <button onClick={() => setActiveTab('BANK_TRANSFER')} className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'BANK_TRANSFER' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <FileText size={14} className="mr-2 hidden sm:inline" />
                Bank Transfer
             </button>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-4" id="printable-section">
          {activeTab === 'DAILY' && renderDailyReport()}

          {activeTab === 'OUTSTANDING' && renderOutstandingReport()}
          {activeTab === 'OWNERS' && renderDirectory('OWNERS')}
          {activeTab === 'TENANTS' && renderDirectory('TENANTS')}

          {activeTab === 'UNPAID' && renderUnpaidList()}
          {activeTab === 'BILLING' && renderBillingReport()}
          {activeTab === 'ADVANCE' && renderAdvanceReport()}
          {activeTab === 'AUDIT' && renderAuditReport()}
          {activeTab === 'BANK_TRANSFER' && renderBankTransferReport()}
       </div>
    </div>
  );
};

export default Reports;

