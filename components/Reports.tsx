
import React, { useMemo, useState } from 'react';
import { AppState, PaymentStatus, Transaction } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink, getTodayDateString, generateReminderLink, downloadPDF } from '../utils/helpers';
import { Clock, AlertCircle, Share2, Edit2, Calendar, Download, MessageCircle, FileText, CheckCircle2, CalendarDays } from 'lucide-react';
import { MAINTENANCE_AMOUNT } from '../constants';

interface ReportsProps {
  state: AppState;
  view: 'REPORTS' | 'UNPAID_LIST';
  refreshState?: (newState: AppState) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

const Reports: React.FC<ReportsProps> = ({ state, view, refreshState, onEditTransaction }) => {
  const [activeTab, setActiveTab] = useState<'DAILY' | 'UNPAID'>(view === 'UNPAID_LIST' ? 'UNPAID' : 'DAILY');
  
  // Date Range State
  const [fromDate, setFromDate] = useState<string>(getTodayDateString());
  const [toDate, setToDate] = useState<string>(getTodayDateString());

  const rangeReport = useMemo(() => {
    if (!fromDate || !toDate) return [];
    return state.transactions.filter(t => {
      const txDate = t.date.split('T')[0];
      return txDate >= fromDate && txDate <= toDate;
    });
  }, [state.transactions, fromDate, toDate]);

  const rangeTotal = rangeReport.reduce((acc, curr) => acc + curr.amount, 0);

  // FIXED: Ensure 231 - 106 = 125 logic is strictly followed
  const unpaidFlats = useMemo(() => {
    const paidFlatIds = new Set(state.transactions.map(t => t.flatId));
    return state.flats.filter(f => !paidFlatIds.has(f.id));
  }, [state.flats, state.transactions]);

  const handleDownload = () => {
    const fileName = activeTab === 'DAILY' 
      ? `Collection_Report_${fromDate}_to_${toDate}.pdf` 
      : `Unpaid_List_${getTodayDateString()}.pdf`;
    
    // Explicitly target the printable-section container
    downloadPDF('printable-section', fileName);
  };

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
             <span className="text-xs text-slate-400 font-bold uppercase">Total Collection</span>
             <span className="text-xl font-black text-green-600 dark:text-green-400 tracking-tight">{formatCurrency(rangeTotal)}</span>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:shadow-none print:rounded-none">
             <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
                <div className="w-10 shrink-0">No</div>
                <div className="w-20 shrink-0">Date</div>
                <div className="w-16 shrink-0">Flat</div>
                <div className="flex-1 min-w-0 px-2">Owner</div>
                <div className="w-20 shrink-0 text-right">Status</div>
                <div className="w-10 shrink-0 text-center no-print"></div>
             </div>
             
             <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                {rangeReport.length === 0 ? (
                   <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">No transactions found for this period.</div>
                ) : rangeReport.map((t) => (
                  <div key={t.receiptNo} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2">
                    <div className="w-10 shrink-0 font-mono text-slate-400 dark:text-slate-500 print:text-black">#{t.receiptNo}</div>
                    <div className="w-20 shrink-0 text-slate-500 dark:text-slate-400 print:text-black">{formatDate(t.date).split(',')[0]}</div>
                    <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{t.flatNumber}</div>
                    <div className="flex-1 min-w-0 px-2 truncate text-slate-600 dark:text-slate-300 print:text-black font-medium">{t.ownerName}</div>
                    <div className="w-20 shrink-0 text-right">
                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider print:border print:border-black print:text-black">PAID</span>
                    </div>
                    <div className="w-10 shrink-0 flex justify-end space-x-1 no-print">
                        <a href={generateWhatsAppLink(t.mobile, t.receiptNo, t.ownerName, t.flatNumber, t.amount, formatDate(t.date))} target="_blank" rel="noreferrer" className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                            <Share2 size={14} />
                        </a>
                    </div>
                  </div>
                ))}
                
                {rangeReport.length > 0 && (
                   <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                      <div className="flex-1 text-right font-black uppercase text-[10px] tracking-widest text-slate-400 dark:text-slate-500">Summary Total Collected</div>
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

  const renderUnpaidList = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center no-print">
        <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pending Payments</h2>
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{unpaidFlats.length}</span>
        </div>
        <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
            <Download size={14} />
            <span>Export PDF</span>
        </button>
       </div>

       <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
            <h2 className="text-lg font-bold text-black uppercase">PENDING PAYMENTS</h2>
            <p className="text-sm text-black">As of: {formatDate(getTodayDateString())}</p>
       </div>

       <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
        <div className="flex items-center bg-black p-4 border-b border-black text-[10px] font-black text-white uppercase tracking-widest">
           <div className="w-20 shrink-0">Flat</div>
           <div className="flex-1 min-w-0 px-2">Owner</div>
           <div className="w-10 shrink-0 text-center no-print"></div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
          {unpaidFlats.map(flat => (
            <div key={flat.id} className="flex items-center p-4 text-xs">
               <div className="w-20 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
               <div className="flex-1 min-w-0 px-2 truncate text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
               <div className="w-10 shrink-0 flex justify-center no-print">
                   {flat.mobile && (
                     <a href={generateReminderLink(flat.mobile, flat.ownerName, flat.flatNumber)} target="_blank" rel="noreferrer" className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                        <MessageCircle size={18} />
                     </a>
                   )}
               </div>
            </div>
          ))}
          {unpaidFlats.length === 0 && (
             <div className="p-12 text-center text-slate-400 font-bold italic">Congratulations! No pending payments.</div>
          )}
        </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
       <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm no-print transition-colors">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
             <button onClick={() => setActiveTab('DAILY')} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'DAILY' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <FileText size={14} className="mr-2" />
                Collection
             </button>
             <button onClick={() => setActiveTab('UNPAID')} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all ${activeTab === 'UNPAID' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <AlertCircle size={14} className="mr-2" />
                Pending
             </button>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-4" id="printable-section">
          {activeTab === 'DAILY' ? renderDailyReport() : renderUnpaidList()}
       </div>
    </div>
  );
};

export default Reports;
