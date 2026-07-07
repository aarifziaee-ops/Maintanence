
// Added missing React and hook imports
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, FinancialRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency, formatDate, getTodayDateString, calculateExpectedTotalBefore } from '../utils/helpers';
import { Wallet, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, IndianRupee, ArrowUpRight, ArrowDownRight, Download, Search, BookOpen, Tags, ChevronRight as ChevronRightIcon, ArrowLeft, Layers } from 'lucide-react';
import { deleteFinancialRecord } from '../services/storageService';
import ConfirmModal from './ConfirmModal';

interface FinanceDashboardProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
  onAddTransaction: () => void;
  onEditTransaction: (record: FinancialRecord) => void;
}

type FinanceTab = 'OVERVIEW' | 'TRANSACTIONS' | 'LEDGER';

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ state, refreshState, onAddTransaction, onEditTransaction }) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('OVERVIEW');
  const [recordToDelete, setRecordToDelete] = useState<FinancialRecord | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const hasCurrentData = state.financialRecords.some(r => r.date.startsWith(currentMonth));
    if (!hasCurrentData && state.financialRecords.length > 0) {
      const sorted = [...state.financialRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sorted[0]) setSelectedMonth(sorted[0].date.slice(0, 7));
    }
  }, [state.financialRecords]);

  const handlePrevMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const balanceData = useMemo(() => {
    let cashInHand = 0;
    let cashAtBank = 0;
    
    // Add maintenance transactions
    state.transactions.forEach(t => {
      const mode = t.paymentMode || 'CASH';
      if (mode === 'CASH') cashInHand += t.amount;
      else cashAtBank += t.amount;
    });
    
    // Add hall bookings (assuming CASH by default if no paymentMode exists, but HallBooking doesn't have paymentMode yet. Let's assume CASH)
    (state.hallBookings || []).forEach(h => {
      cashInHand += h.amount;
    });

    const allRecords = [...state.financialRecords].filter(r => r.type !== 'VENDOR_BILL').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    allRecords.forEach(r => {
      const mode = r.paymentMode || 'CASH';
      if (r.type === 'INCOME') {
        if (mode === 'CASH') cashInHand += r.amount; else cashAtBank += r.amount;
      } else if (r.type === 'EXPENSE') {
        if (mode === 'CASH') cashInHand -= r.amount; else cashAtBank -= r.amount;
      } else if (r.type === 'TRANSFER') {
        if (mode === 'CASH') { cashInHand -= r.amount; cashAtBank += r.amount; }
        else { cashAtBank -= r.amount; cashInHand += r.amount; }
      }
    });
    return { cashInHand, cashAtBank };
  }, [state.financialRecords, state.transactions, state.hallBookings]);

  const reportData = useMemo(() => {
     const startOfMonthStr = selectedMonth + '-01';
     let openingBalance = 0;
     const maintenanceBefore = state.transactions.filter(t => t.date < startOfMonthStr).reduce((sum, t) => sum + t.amount, 0);
     const hallBefore = (state.hallBookings || []).filter(h => h.bookingDate < startOfMonthStr).reduce((sum, h) => sum + h.amount, 0);
     state.financialRecords.filter(r => r.type !== 'VENDOR_BILL').forEach(r => {
         if (r.date < startOfMonthStr) {
             if (r.type === 'INCOME') openingBalance += r.amount;
             if (r.type === 'EXPENSE') openingBalance -= r.amount;
         }
     });
     openingBalance += maintenanceBefore + hallBefore;
     const maintenanceThisMonth = state.transactions.filter(t => t.date.startsWith(selectedMonth)).reduce((sum, t) => sum + t.amount, 0);
     
     let recoveryThisMonth = 0;
     const selYear = parseInt(selectedMonth.split('-')[0]);
     const selMonth = parseInt(selectedMonth.split('-')[1]);
     const EPOCH_YEAR = 2026;
     const EPOCH_MONTH = 4;

     state.flats.forEach(flat => {
         const expectedTotalBefore = calculateExpectedTotalBefore(flat, EPOCH_YEAR, EPOCH_MONTH, selYear, selMonth);
         const totalPaidBefore = state.transactions
             .filter(t => t.flatId === flat.id && t.date < startOfMonthStr)
             .reduce((sum, t) => sum + t.amount, 0);
         
         const arrears = Math.max(0, expectedTotalBefore - totalPaidBefore);
         
         const paidThisMonth = state.transactions
             .filter(t => t.flatId === flat.id && t.date.startsWith(selectedMonth))
             .reduce((sum, t) => sum + t.amount, 0);
             
         if (paidThisMonth > 0 && arrears > 0) {
             recoveryThisMonth += Math.min(paidThisMonth, arrears);
         }
     });
     
     const currentCollectionThisMonth = Math.max(0, maintenanceThisMonth - recoveryThisMonth);

     const hallThisMonth = (state.hallBookings || []).filter(h => h.bookingDate.startsWith(selectedMonth)).reduce((sum, h) => sum + h.amount, 0);
     const incomeRecords = state.financialRecords.filter(r => r.type === 'INCOME' && r.date.startsWith(selectedMonth));
     const totalOtherIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0) + hallThisMonth;
     const expenseRecords = state.financialRecords.filter(r => r.type === 'EXPENSE' && r.date.startsWith(selectedMonth));
     const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
     const totalIncome = maintenanceThisMonth + totalOtherIncome;
     const closingBalance = openingBalance + totalIncome - totalExpenses;
     return { openingBalance, maintenanceThisMonth, recoveryThisMonth, currentCollectionThisMonth, totalOtherIncome, totalExpenses, totalIncome, closingBalance, globalCash: balanceData.cashInHand, globalBank: balanceData.cashAtBank };
  }, [state, selectedMonth, balanceData]);

  const categorizedLedger = useMemo(() => {
    const categories: Record<string, { totalIncome: number; totalExpense: number; count: number }> = {};
    
    state.financialRecords.filter(r => r.type !== 'VENDOR_BILL').forEach(r => {
      const cat = r.category || 'General';
      if (!categories[cat]) {
        categories[cat] = { totalIncome: 0, totalExpense: 0, count: 0 };
      }
      if (r.type === 'INCOME') categories[cat].totalIncome += r.amount;
      if (r.type === 'EXPENSE') categories[cat].totalExpense += r.amount;
      categories[cat].count += 1;
    });

    state.transactions.forEach(t => {
      const cat = 'Maintenance';
      if (!categories[cat]) categories[cat] = { totalIncome: 0, totalExpense: 0, count: 0 };
      categories[cat].totalIncome += t.amount;
      categories[cat].count += 1;
    });

    (state.hallBookings || []).forEach(h => {
      const cat = 'Hall Booking';
      if (!categories[cat]) categories[cat] = { totalIncome: 0, totalExpense: 0, count: 0 };
      categories[cat].totalIncome += h.amount;
      categories[cat].count += 1;
    });

    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .filter(c => c.name.toLowerCase().includes(ledgerSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.financialRecords, state.transactions, state.hallBookings, ledgerSearch]);

  const detailRecords = useMemo(() => {
    if (!selectedCategory) return [];
    
    const regularRecords = state.financialRecords
      .filter(r => r.category === selectedCategory && r.type !== 'VENDOR_BILL')
      .map(r => ({ ...r, displayTitle: r.description || 'No narration', displayCategory: r.category }));
      
    const maintenanceRecords = selectedCategory === 'Maintenance' 
      ? state.transactions.map(t => ({
          id: `m-${t.receiptNo}-${t.flatId}-${t.timestamp || t.amount}`,
          date: t.date,
          type: 'INCOME' as const,
          amount: t.amount,
          paymentMode: t.paymentMode || 'CASH',
          displayTitle: `Maintenance Receipt #${t.receiptNo} - ${t.flatNumber}`,
          displayCategory: 'Maintenance'
        }))
      : [];

    const hallRecords = selectedCategory === 'Hall Booking'
      ? (state.hallBookings || []).map(h => ({
          id: `h-${h.id}`,
          date: h.bookingDate,
          type: 'INCOME' as const,
          amount: h.amount,
          paymentMode: 'CASH',
          displayTitle: `Hall Booking - ${h.name} (${h.phone})`,
          displayCategory: 'Hall Booking'
        }))
      : [];

    return [...regularRecords, ...maintenanceRecords, ...hallRecords]
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.financialRecords, state.transactions, state.hallBookings, selectedCategory]);

  const generatePDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      const element = document.getElementById('financial-report-template');
      if (!element) return;
      const opt = { margin: 0.5, filename: `Financial_Report_${selectedMonth}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
      (window as any).html2pdf().from(element).set(opt).save().then(() => setIsGeneratingPdf(false));
    }, 100);
  };

  const handleDelete = (record: FinancialRecord) => {
    setRecordToDelete(record);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      const newState = deleteFinancialRecord(state, recordToDelete.id);
      refreshState(newState);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <ConfirmModal
        isOpen={!!recordToDelete}
        title="Delete Record"
        message={recordToDelete ? `Are you sure you want to delete "${recordToDelete.description || recordToDelete.category}" (${formatCurrency(recordToDelete.amount)})?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />
      {/* Navigation Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                <span className="text-sm font-bold text-slate-800 dark:text-white px-2 min-w-[100px] text-center">{new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-all shadow-sm"><ChevronRight size={16} /></button>
            </div>
            <button onClick={generatePDF} className="flex items-center space-x-2 px-3 py-2 bg-slate-800 dark:bg-black text-white rounded-lg shadow-lg active:scale-95"><Download size={14} /><span className="text-xs font-bold">PDF</span></button>
        </div>
        <div className="flex px-4 pb-2 space-x-4">
            <button onClick={() => { setActiveTab('OVERVIEW'); setSelectedCategory(null); }} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Overview</button>
            <button onClick={() => { setActiveTab('TRANSACTIONS'); setSelectedCategory(null); }} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'TRANSACTIONS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Records</button>
            <button onClick={() => setActiveTab('LEDGER')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'LEDGER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>Ledger</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-600 p-5 rounded-2xl shadow-lg text-white">
                    <p className="text-emerald-100 text-[10px] font-black uppercase mb-1">Cash In Hand</p>
                    <h3 className="text-2xl font-black">{formatCurrency(balanceData.cashInHand)}</h3>
                </div>
                <div className="bg-blue-600 p-5 rounded-2xl shadow-lg text-white">
                    <p className="text-blue-100 text-[10px] font-black uppercase mb-1">Bank Balance</p>
                    <h3 className="text-2xl font-black">{formatCurrency(balanceData.cashAtBank)}</h3>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase">Income</p>
                    <p className="text-sm font-black text-emerald-600">{formatCurrency(reportData.totalIncome)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase">Expense</p>
                    <p className="text-sm font-black text-red-600">{formatCurrency(reportData.totalExpenses)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase">Closing</p>
                    <p className="text-sm font-black text-blue-600">{formatCurrency(reportData.closingBalance)}</p>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'TRANSACTIONS' && (
          <div className="space-y-3">
             {(() => {
               const regularRecords = state.financialRecords
                 .filter(r => r.date.startsWith(selectedMonth) && r.type !== 'VENDOR_BILL')
                 .map(r => ({ ...r, displayTitle: r.description || 'No narration', displayCategory: r.category, canEdit: true }));
               
               const maintenanceRecords = state.transactions
                 .filter(t => t.date.startsWith(selectedMonth))
                 .map(t => ({
                    id: `m-${t.receiptNo}-${t.flatId}-${t.timestamp || t.amount}`,
                    date: t.date,
                    type: 'INCOME' as const,
                    amount: t.amount,
                    paymentMode: t.paymentMode || 'CASH',
                    displayTitle: `Maintenance Receipt #${t.receiptNo} - ${t.flatNumber}`,
                    displayCategory: 'Maintenance',
                    canEdit: false
                 }));

               const hallRecords = (state.hallBookings || [])
                 .filter(h => h.bookingDate.startsWith(selectedMonth))
                 .map(h => ({
                    id: `h-${h.id}`,
                    date: h.bookingDate,
                    type: 'INCOME' as const,
                    amount: h.amount,
                    paymentMode: 'CASH',
                    displayTitle: `Hall Booking - ${h.name} (${h.phone})`,
                    displayCategory: 'Hall Booking',
                    canEdit: false
                 }));

               const allMerged = [...regularRecords, ...maintenanceRecords, ...hallRecords].sort((a,b) => b.date.localeCompare(a.date));

               if (allMerged.length === 0) {
                 return <div className="text-center py-10 text-slate-400 font-bold text-sm">No records found for this month</div>;
               }

               return allMerged.map(record => (
                <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group shadow-sm transition-all hover:border-slate-200">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${record.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {record.type === 'INCOME' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800 dark:text-white break-words">{record.displayTitle}</p>
                            <div className="flex items-center mt-1 space-x-2 flex-wrap gap-y-1">
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">{record.displayCategory}</span>
                                <p className="text-[10px] text-slate-400 uppercase font-black">{formatDate(record.date)} • {record.paymentMode}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 ml-4 min-w-[80px]">
                        <p className={`text-sm font-black ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                        </p>
                        {record.canEdit && (
                        <div className="flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                            <button onClick={() => onEditTransaction(record as FinancialRecord)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={12} /></button>
                            <button onClick={() => handleDelete(record as FinancialRecord)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </div>
                        )}
                    </div>
                </div>
             ))})()}
          </div>
        )}

        {activeTab === 'LEDGER' && (
          <div className="space-y-4">
             {!selectedCategory ? (
               <>
                 <div className="relative">
                    <Search className="absolute left-3 top-3 text-blue-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search accounts or categories..." 
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold shadow-sm"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                    />
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                    {categorizedLedger.map(cat => (
                      <button 
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-blue-500 transition-all group active:scale-[0.98]"
                      >
                         <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                               <Layers size={24} />
                            </div>
                            <div className="text-left">
                               <p className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">{cat.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.count} Payments recorded</p>
                            </div>
                         </div>
                         <div className="flex items-center space-x-4">
                            <div className="text-right">
                               <p className="text-sm font-black text-red-600">-{formatCurrency(cat.totalExpense)}</p>
                               {cat.totalIncome > 0 && <p className="text-[10px] font-black text-emerald-600">+{formatCurrency(cat.totalIncome)}</p>}
                            </div>
                            <ChevronRightIcon size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                         </div>
                      </button>
                    ))}
                 </div>
               </>
             ) : (
               <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="flex items-center justify-between mb-2">
                     <button 
                       onClick={() => setSelectedCategory(null)}
                       className="flex items-center space-x-2 text-blue-600 font-black text-xs uppercase hover:underline p-2"
                     >
                        <ArrowLeft size={16} />
                        <span>Back to Ledger Summary</span>
                     </button>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
                     <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mb-1">Account Ledger</p>
                        <h4 className="text-2xl font-black mb-2">{selectedCategory}</h4>
                        <div className="flex space-x-6">
                            <div>
                                <p className="text-[9px] font-black uppercase opacity-50">Total Paid Out</p>
                                <p className="text-lg font-black text-red-400">{formatCurrency(detailRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + r.amount, 0))}</p>
                            </div>
                            {detailRecords.some(r => r.type === 'INCOME') && (
                                <div>
                                    <p className="text-[9px] font-black uppercase opacity-50">Total Received</p>
                                    <p className="text-lg font-black text-emerald-400">{formatCurrency(detailRecords.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + r.amount, 0))}</p>
                                </div>
                            )}
                        </div>
                     </div>
                     <Layers size={100} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                     <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {detailRecords.map(r => (
                           <div key={r.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                              <div className="flex items-center space-x-4 flex-1 min-w-0">
                                 <div className="text-center min-w-[50px] shrink-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(r.date).toLocaleDateString('en-IN', { month: 'short' })}</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{new Date(r.date).getDate()}</p>
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-800 dark:text-white leading-tight break-words">{r.displayTitle || r.description || 'No description'}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{r.paymentMode} • {r.type}</p>
                                 </div>
                              </div>
                              <div className="flex items-center space-x-3 ml-4 shrink-0 min-w-[90px] justify-end">
                                 <p className={`text-sm font-black ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {r.type === 'INCOME' ? '+' : '-'}{formatCurrency(r.amount)}
                                 </p>
                                 {(!r.id.startsWith('m-') && !r.id.startsWith('h-')) && (
                                 <div className="flex flex-col space-y-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditTransaction(r as FinancialRecord)} className="text-blue-500 hover:bg-blue-100 p-1.5 rounded-lg transition-colors">
                                       <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(r as FinancialRecord)} className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors">
                                       <Trash2 size={14} />
                                    </button>
                                 </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>

      <button onClick={onAddTransaction} className="fixed bottom-24 right-4 bg-slate-900 dark:bg-white text-white dark:text-black p-4 rounded-full shadow-xl z-20 active:scale-90 transition-transform"><Plus size={24} /></button>

      {/* PDF TEMPLATE */}
      <div id="financial-report-template" className={`${isGeneratingPdf ? 'block' : 'hidden'} bg-white p-8 text-black text-xs leading-relaxed`}>
          <div className="text-center mb-6">
              <h1 className="text-xl font-black uppercase">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-sm font-bold uppercase mt-1">Financial Report: {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', {month: 'long', year: 'numeric'})}</h2>
          </div>
          <p className="font-black text-[10px] uppercase mb-2 border-b">Consolidated Ledger</p>
          <table className="w-full border-collapse">
              <thead>
                  <tr className="bg-slate-100">
                    <th className="p-1 border text-left">Category</th>
                    <th className="p-1 border text-right">Income</th>
                    <th className="p-1 border text-right">Expense</th>
                    <th className="p-1 border text-right">Count</th>
                  </tr>
              </thead>
              <tbody>
                  {categorizedLedger.map(c => (
                      <tr key={c.name}>
                        <td className="p-1 border font-bold uppercase">{c.name}</td>
                        <td className="p-1 border text-right text-green-600">{formatCurrency(c.totalIncome)}</td>
                        <td className="p-1 border text-right text-red-600">{formatCurrency(c.totalExpense)}</td>
                        <td className="p-1 border text-right">{c.count}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default FinanceDashboard;
