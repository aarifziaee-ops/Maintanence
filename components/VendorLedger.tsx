import React, { useState, useMemo } from 'react';
import { AppState, Vendor, FinancialRecord } from '../types';
import { ArrowLeft, Download, Plus, Minus, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { formatCurrency, getTodayDateString, downloadPDF } from '../utils/helpers';
import { addFinancialRecord, deleteFinancialRecord } from '../services/storageService';

interface VendorLedgerProps {
  vendor: Vendor;
  state: AppState;
  refreshState: (newState: AppState) => void;
  onBack: () => void;
}

const VendorLedger: React.FC<VendorLedgerProps> = ({ vendor, state, refreshState, onBack }) => {
  const [showTransactionForm, setShowTransactionForm] = useState<'BILL' | 'PAYMENT' | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK'>('BANK');

  // Calculate Ledger Entries
  const ledgerEntries = useMemo(() => {
    const entries: { date: string; description: string; debit: number; credit: number; balance: number; id: string; type: 'OPENING' | 'RECORD' }[] = [];
    
    // 1. Opening Balance
    let currentBalance = vendor.openingBalance || 0;
    entries.push({
      id: 'opening',
      date: vendor.createdAt.split('T')[0],
      description: 'Opening Balance',
      debit: 0,
      credit: 0,
      balance: currentBalance,
      type: 'OPENING'
    });

    // 2. Get all transactions for this vendor
    const vendorRecords = state.financialRecords
      .filter(r => r.vendorId === vendor.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Process each transaction
    vendorRecords.forEach(record => {
      let debit = 0;
      let credit = 0;

      if (record.type === 'VENDOR_BILL') {
        credit = record.amount; // Bill increases what we owe
        currentBalance += credit;
      } else if (record.type === 'EXPENSE') {
        debit = record.amount; // Payment decreases what we owe
        currentBalance -= debit;
      }

      entries.push({
        id: record.id,
        date: record.date,
        description: record.description || (record.type === 'VENDOR_BILL' ? 'Bill Generated' : 'Payment Made'),
        debit,
        credit,
        balance: currentBalance,
        type: 'RECORD'
      });
    });

    return entries.reverse(); // Show newest first
  }, [vendor, state.financialRecords]);

  const summary = useMemo(() => {
    const totalPaid = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalBilled = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
    const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[0].balance : (vendor.openingBalance || 0);
    return { totalPaid, totalBilled, closingBalance };
  }, [ledgerEntries, vendor.openingBalance]);

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const record: Omit<FinancialRecord, 'id' | 'timestamp'> = {
      type: showTransactionForm === 'BILL' ? 'VENDOR_BILL' : 'EXPENSE',
      paymentMode: showTransactionForm === 'BILL' ? 'CASH' : paymentMode, // Bills don't really have a mode
      amount: Number(amount),
      date,
      category: vendor.category,
      description: description || (showTransactionForm === 'BILL' ? 'Vendor Bill' : 'Vendor Payment'),
      vendorId: vendor.id
    };

    const newState = addFinancialRecord(state, record);
    refreshState(newState);
    
    setShowTransactionForm(null);
    setAmount('');
    setDescription('');
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const newState = deleteFinancialRecord(state, id);
      refreshState(newState);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Debit (Paid)', 'Credit (Bill)', 'Balance'];
    const rows = [...ledgerEntries].reverse().map(e => [
      e.date,
      e.description,
      e.debit.toString(),
      e.credit.toString(),
      e.balance.toString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${vendor.name.replace(/\s+/g, '_')}_Ledger.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 flex items-center justify-between no-print">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{vendor.name}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendor Ledger</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleExportCSV} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors" title="Export CSV">
            <FileText size={18} />
          </button>
          <button onClick={() => downloadPDF('vendor-ledger-print', `${vendor.name}_Ledger.pdf`)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors" title="Export PDF">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-24" id="vendor-ledger-print">
        
        {/* Print Header (Hidden on screen) */}
        <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
            <h2 className="text-lg font-bold text-black uppercase">Vendor Ledger</h2>
            <p className="text-sm text-black font-medium mt-2">Vendor: {vendor.name}</p>
            <p className="text-xs text-black">Category: {vendor.category} | Type: {vendor.paymentType}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Billed</p>
            <p className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(summary.totalBilled)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
            <p className="text-sm font-black text-green-600 dark:text-green-500">{formatCurrency(summary.totalPaid)}</p>
          </div>
          <div className={`p-3 rounded-xl shadow-sm border text-center ${summary.closingBalance > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${summary.closingBalance > 0 ? 'text-red-500' : 'text-slate-400'}`}>Outstanding</p>
            <p className={`text-sm font-black ${summary.closingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
              {formatCurrency(Math.abs(summary.closingBalance))} {summary.closingBalance > 0 ? 'Dr' : summary.closingBalance < 0 ? 'Cr' : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons (Hidden on print) */}
        <div className="grid grid-cols-2 gap-3 mb-6 no-print">
          <button 
            onClick={() => setShowTransactionForm('PAYMENT')}
            className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <Minus size={16} /> <span>Record Payment</span>
          </button>
          <button 
            onClick={() => setShowTransactionForm('BILL')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus size={16} /> <span>Add Bill</span>
          </button>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right text-green-600 dark:text-green-500">Debit (Paid)</th>
                  <th className="px-4 py-3 text-right text-red-600 dark:text-red-500">Credit (Bill)</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledgerEntries.map((entry, idx) => (
                  <tr key={`${entry.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{entry.date}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">{entry.description}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-500 font-medium">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-500 font-medium">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${entry.balance > 0 ? 'text-red-600 dark:text-red-400' : entry.balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                      {formatCurrency(Math.abs(entry.balance))} {entry.balance > 0 ? 'Dr' : entry.balance < 0 ? 'Cr' : ''}
                    </td>
                    <td className="px-4 py-3 text-center no-print">
                      {entry.type === 'RECORD' && (
                        <button onClick={() => handleDeleteRecord(entry.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">
                {showTransactionForm === 'BILL' ? 'Add Vendor Bill' : 'Record Payment'}
              </h3>
              <button onClick={() => setShowTransactionForm(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            
            <div className="p-5">
              <form id="ledger-tx-form" onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                    <input required type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder={showTransactionForm === 'BILL' ? 'e.g., Monthly Maintenance' : 'e.g., Paid via Cheque'} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {showTransactionForm === 'PAYMENT' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Mode</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="paymentMode" value="CASH" checked={paymentMode === 'CASH'} onChange={() => setPaymentMode('CASH')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cash</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="paymentMode" value="BANK" checked={paymentMode === 'BANK'} onChange={() => setPaymentMode('BANK')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bank Transfer</span>
                      </label>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button type="submit" form="ledger-tx-form" className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 ${showTransactionForm === 'BILL' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                <CheckCircle2 size={20} />
                <span>{showTransactionForm === 'BILL' ? 'Save Bill' : 'Save Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLedger;
