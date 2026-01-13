
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, PaymentStatus, Transaction } from '../types';
import { processPayment, deleteTransaction, updateTransaction } from '../services/storageService';
import { generateWhatsAppLink, amountToWords, formatDate, formatCurrency, getTodayDateString } from '../utils/helpers';
import { CheckCircle2, Share2, Search, ArrowRight, Trash2, Edit2, History, PlusCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { MAINTENANCE_AMOUNT } from '../constants';

interface PaymentFormProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
  initialTransactionToEdit?: Transaction | null;
  onClearEdit?: () => void;
}

type TabMode = 'NEW' | 'HISTORY';

const PaymentForm: React.FC<PaymentFormProps> = ({ state, refreshState, initialTransactionToEdit, onClearEdit }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('NEW');
  
  // New Payment / Edit State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState<number>(MAINTENANCE_AMOUNT);
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  
  // Edit Specific
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isChangingFlat, setIsChangingFlat] = useState(false);

  // Success State
  const [generatedReceipt, setGeneratedReceipt] = useState<{
    receiptNo: number;
    date: string;
    amount: number;
    name: string;
    flat: string;
    mobile: string;
  } | null>(null);

  // Handle incoming edit request from props
  useEffect(() => {
    if (initialTransactionToEdit) {
      startEdit(initialTransactionToEdit);
    }
  }, [initialTransactionToEdit]);

  // --- Search Logic ---
  const filteredFlats = useMemo(() => {
    return state.flats.filter(flat => 
      (flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
       flat.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (flat.status === PaymentStatus.UNPAID || (editingTx && flat.id === editingTx.flatId))
    );
  }, [state.flats, searchTerm, editingTx]);

  const filteredHistory = useMemo(() => {
    return state.transactions.filter(tx => 
      tx.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNo.toString().includes(searchTerm)
    );
  }, [state.transactions, searchTerm]);

  const handleSelectFlat = (flatId: string) => {
    const flat = state.flats.find(f => f.id === flatId);
    if (flat) {
      setSelectedFlatId(flatId);
      // Only overwrite names if we aren't mid-edit or if we explicitly changed flat
      if (!editingTx || isChangingFlat) {
          setOwnerName(flat.ownerName || '');
          setMobile(flat.mobile || '');
      }
      setStep(2);
      setIsChangingFlat(false);
    }
  };

  const sanitizeMobile = (rawMobile: string): string => {
    if (!rawMobile) return '';
    let clean = rawMobile.replace(/\D/g, '');
    if (clean.length === 11 && clean.startsWith('0')) clean = clean.substring(1);
    if (clean.length === 12 && clean.startsWith('91')) clean = clean.substring(2);
    if (clean.length > 10) clean = clean.substring(0, 10);
    return clean;
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatId) return;

    const cleanMobile = sanitizeMobile(mobile);

    try {
      const { newState, transaction } = processPayment(
        state,
        selectedFlatId,
        ownerName,
        cleanMobile,
        amount,
        paymentDate
      );
      
      refreshState(newState);
      setGeneratedReceipt({
        receiptNo: transaction.receiptNo,
        date: formatDate(transaction.date),
        amount: transaction.amount,
        name: transaction.ownerName,
        flat: transaction.flatNumber,
        mobile: transaction.mobile
      });
      setStep(3);
    } catch (error) {
      alert("Error processing payment");
    }
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !selectedFlatId) return;

    const cleanMobile = sanitizeMobile(mobile);
    const flat = state.flats.find(f => f.id === selectedFlatId);

    try {
      const newState = updateTransaction(state, editingTx.receiptNo, {
        ownerName,
        mobile: cleanMobile,
        amount,
        date: paymentDate,
        flatId: selectedFlatId,
        flatNumber: flat?.flatNumber || editingTx.flatNumber
      });
      refreshState(newState);
      setEditingTx(null);
      resetForm();
      alert(`Receipt #${editingTx.receiptNo} updated successfully.`);
    } catch (error) {
      alert("Failed to update transaction");
    }
  };

  const handleDelete = (receiptNo: number) => {
    if (window.confirm(`Are you sure you want to delete Receipt #${receiptNo}?\nThis will mark the flat as UNPAID.`)) {
      const newState = deleteTransaction(state, receiptNo);
      refreshState(newState);
      if (generatedReceipt?.receiptNo === receiptNo) resetForm();
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setSelectedFlatId(tx.flatId);
    setOwnerName(tx.ownerName);
    setMobile(tx.mobile);
    setAmount(tx.amount);
    
    let dateVal = getTodayDateString();
    if (tx.date) {
        try {
            dateVal = new Date(tx.date).toISOString().split('T')[0];
        } catch (e) {
            console.error("Invalid date in transaction", tx.date);
        }
    }
    setPaymentDate(dateVal);
    setStep(2);
    setActiveTab('NEW');
  };

  const resetForm = () => {
    setStep(1);
    setSearchTerm('');
    setSelectedFlatId(null);
    setOwnerName('');
    setMobile('');
    setAmount(MAINTENANCE_AMOUNT);
    setPaymentDate(getTodayDateString());
    setGeneratedReceipt(null);
    setEditingTx(null);
    setIsChangingFlat(false);
    if (onClearEdit) onClearEdit();
  };

  const renderTabs = () => (
    <div className="flex p-4 space-x-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <button
        onClick={() => { setActiveTab('NEW'); resetForm(); }}
        className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center space-x-2 transition-colors ${activeTab === 'NEW' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
      >
        <PlusCircle size={16} />
        <span>Collect</span>
      </button>
      <button
        onClick={() => { setActiveTab('HISTORY'); resetForm(); }}
        className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center space-x-2 transition-colors ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
      >
        <History size={16} />
        <span>History</span>
      </button>
    </div>
  );

  // --- VIEW: HISTORY ---
  if (activeTab === 'HISTORY') {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
        {renderTabs()}
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search receipt, flat, or name..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3 pb-20">
            {filteredHistory.length === 0 ? (
               <div className="text-center text-slate-400 dark:text-slate-500 mt-10">
                <p>No transactions found.</p>
              </div>
            ) : (
              filteredHistory.map(tx => (
                <div key={tx.receiptNo} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-lg text-slate-800 dark:text-white">{tx.flatNumber}</span>
                      <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">#{tx.receiptNo}</span>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(tx.amount)}</span>
                  </div>
                  
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 space-y-1">
                    <p>{tx.ownerName}</p>
                    <p className="text-xs">{formatDate(tx.date)}</p>
                  </div>

                  <div className="flex space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => startEdit(tx)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(tx.receiptNo)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: NEW / EDIT COLLECTION ---

  // STEP 2: DETAILS FORM
  if (step === 2) {
    const title = editingTx ? `Edit Receipt #${editingTx.receiptNo}` : 'Payment Details';
    const flatNum = state.flats.find(f => f.id === selectedFlatId)?.flatNumber || 'N/A';

    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="p-4">
          <button onClick={resetForm} className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-4 flex items-center">
             &larr; Cancel
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{title}</h2>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-6 flex justify-between items-center group">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Unit Number</p>
              <p className="text-3xl font-black text-blue-900 dark:text-blue-100 tracking-tight">{flatNum}</p>
            </div>
            <button 
                onClick={() => { setIsChangingFlat(true); setStep(1); }}
                className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm text-blue-600 dark:text-blue-400 hover:scale-110 active:scale-95 transition-all"
                title="Change Flat Number"
            >
                <RefreshCw size={20} />
            </button>
          </div>

          <form onSubmit={editingTx ? handleUpdateTransaction : handlePayment} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Owner Name</label>
              <input
                required
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                placeholder="Enter owner name"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Mobile (Optional)</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Date</label>
                <input
                  required
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Amount</label>
                <div className="relative">
                   <span className="absolute left-3 top-3.5 text-slate-400 font-bold">₹</span>
                   <input
                    required
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 dark:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 size={20} />
                <span>{editingTx ? 'Update Receipt' : 'Generate Receipt'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Success View (Step 3)
  if (step === 3 && generatedReceipt) {
     return (
    <div className="p-4 flex flex-col items-center justify-center h-full text-center bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={40} />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Payment Successful</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Receipt #{generatedReceipt?.receiptNo} Generated</p>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors w-full mb-8 text-left">
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 dark:text-slate-400">Amount</span>
          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(generatedReceipt!.amount)}</span>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 text-right mb-4 italic">
          {amountToWords(generatedReceipt!.amount)}
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 dark:text-slate-400">Flat</span>
          <span className="font-medium text-slate-900 dark:text-white">{generatedReceipt!.flat}</span>
        </div>
         <div className="flex justify-between mb-2">
          <span className="text-slate-500 dark:text-slate-400">Date</span>
          <span className="font-medium text-slate-900 dark:text-white">{generatedReceipt!.date}</span>
        </div>
      </div>

      {generatedReceipt!.mobile ? (
        <a
          href={generateWhatsAppLink(
            generatedReceipt!.mobile,
            generatedReceipt!.receiptNo,
            generatedReceipt!.name,
            generatedReceipt!.flat,
            generatedReceipt!.amount,
            generatedReceipt!.date
          )}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center space-x-2 bg-[#25D366] text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 dark:shadow-none mb-3 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Share2 size={20} />
          <span>Share Receipt on WhatsApp</span>
        </a>
      ) : (
         <div className="w-full flex items-center justify-center space-x-2 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold py-3 rounded-xl mb-3">
            <Share2 size={20} />
            <span>No Mobile for WhatsApp</span>
         </div>
      )}
      
      <button
        onClick={resetForm}
        className="w-full py-3 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        Close & Done
      </button>
    </div>
  );
  }

  // STEP 1: SEARCH & SELECT
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
      {renderTabs()}
      
      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
            {editingTx ? 'Change Unit for Receipt' : 'Select Unit'}
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-3.5 text-blue-500" size={20} />
          <input
            type="text"
            placeholder="Search flat number or owner..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2.5 pb-24">
          {filteredFlats.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-500 mt-10">
              {searchTerm ? <p>No matching unpaid units found.</p> : <p>Search for a unit to begin.</p>}
            </div>
          ) : (
            filteredFlats.map(flat => (
              <button
                key={flat.id}
                onClick={() => handleSelectFlat(flat.id)}
                className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    selectedFlatId === flat.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-100 shadow-sm'
                }`}
              >
                <div className="text-left flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                      selectedFlatId === flat.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {flat.flatNumber.split('-')[1]}
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800 dark:text-white block leading-tight">{flat.flatNumber}</span>
                    {flat.ownerName && <span className="block text-sm text-slate-500 dark:text-slate-400">{flat.ownerName}</span>}
                  </div>
                </div>
                <div className="text-slate-300 dark:text-slate-600">
                  <ArrowRight size={20} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
