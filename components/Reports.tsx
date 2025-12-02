
import React, { useMemo, useState } from 'react';
import { AppState, PaymentStatus, Transaction } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../utils/helpers';
import { Clock, AlertCircle, Share2, Edit2, Calendar } from 'lucide-react';

interface ReportsProps {
  state: AppState;
  view: 'REPORTS' | 'UNPAID_LIST';
  refreshState?: (newState: AppState) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

const Reports: React.FC<ReportsProps> = ({ state, view, refreshState, onEditTransaction }) => {
  
  // Default to today's date in YYYY-MM-DD format for the input
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const dailyReport = useMemo(() => {
    // Filter transactions where the ISO date string starts with the selected YYYY-MM-DD
    if (!selectedDate) return [];
    return state.transactions.filter(t => t.date.startsWith(selectedDate));
  }, [state.transactions, selectedDate]);

  const dailyTotal = dailyReport.reduce((acc, curr) => acc + curr.amount, 0);

  const unpaidFlats = useMemo(() => {
    return state.flats.filter(f => f.status === PaymentStatus.UNPAID);
  }, [state.flats]);

  if (view === 'REPORTS') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Daily Collection Report</h2>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex justify-between items-center shadow-sm">
          <div>
             <label className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center">
                <Calendar size={12} className="mr-1" />
                Select Date
             </label>
             <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             />
          </div>
          <div className="text-right">
             <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Amount</p>
             <p className="text-xl font-bold text-green-600">{formatCurrency(dailyTotal)}</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Transactions ({dailyReport.length})</h3>
        
        {dailyReport.length === 0 ? (
           <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Clock className="mx-auto text-slate-400 mb-2" />
            <p className="text-slate-500">
              {selectedDate ? `No transactions found for ${formatDate(selectedDate)}.` : 'Please select a date.'}
            </p>
           </div>
        ) : (
          <div className="space-y-3">
            {dailyReport.map((t) => (
              <div key={t.receiptNo} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                
                {/* Updated Layout: Flat and Name on one line */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <div className="text-sm text-slate-800 leading-snug">
                      <span className="font-bold text-base mr-2">{t.flatNumber}</span>
                      <span className="text-slate-600">{t.ownerName}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">#{t.receiptNo}</span>
                    </div>
                  </div>
                  <div className="font-bold text-slate-700 text-lg whitespace-nowrap">{formatCurrency(t.amount)}</div>
                </div>
                
                <div className="flex items-center space-x-2 pt-3 border-t border-slate-50">
                   <a 
                     href={generateWhatsAppLink(t.mobile, t.receiptNo, t.ownerName, t.flatNumber, t.amount, formatDate(t.date))}
                     target="_blank"
                     rel="noreferrer"
                     className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-green-50 text-green-700 font-medium text-xs hover:bg-green-100"
                   >
                     <Share2 size={14} />
                     <span>Share</span>
                   </a>
                   
                   {onEditTransaction && (
                     <button
                       type="button"
                       onClick={() => onEditTransaction(t)}
                       className="flex items-center justify-center space-x-1 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium text-xs hover:bg-blue-100"
                     >
                        <Edit2 size={14} />
                        <span>Edit</span>
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // UNPAID LIST VIEW
  return (
    <div className="p-4 h-full flex flex-col">
       <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-bold text-slate-800">Pending Payments</h2>
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
          {unpaidFlats.length} Pending
        </span>
       </div>

       <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Flat</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {unpaidFlats.map(flat => (
              <tr key={flat.id}>
                <td className="p-4">
                  <span className="font-bold text-slate-800 block">{flat.flatNumber}</span>
                  {flat.ownerName && <span className="text-xs text-slate-400">{flat.ownerName}</span>}
                </td>
                <td className="p-4">
                  <div className="flex items-center text-red-500 space-x-1">
                    <AlertCircle size={14} />
                    <span className="text-xs font-bold">UNPAID</span>
                  </div>
                </td>
              </tr>
            ))}
            {unpaidFlats.length === 0 && (
              <tr>
                <td colSpan={2} className="p-8 text-center text-green-600 font-medium">
                  All flats have paid! 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
       </div>
    </div>
  );
};

export default Reports;
