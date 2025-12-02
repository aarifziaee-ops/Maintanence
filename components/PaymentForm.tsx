
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, PaymentStatus, Transaction } from '../types';
import { processPayment, deleteTransaction, updateTransaction } from '../services/storageService';
import { generateWhatsAppLink, amountToWords, formatDate, formatCurrency, getTodayDateString } from '../utils/helpers';
import { CheckCircle2, Share2, Search, ArrowRight, Trash2, Edit2, History, PlusCircle, AlertCircle, XCircle } from 'lucide-react';
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
  
  // New Payment State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState<number>(MAINTENANCE_AMOUNT);
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  
  // Edit / Delete State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

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

  // --- Search Logic for New Payments ---
  const filteredFlats = useMemo(() => {
    return state.flats.filter(flat => 
      (flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
       flat.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      flat.status === PaymentStatus.UNPAID
    );
  }, [state.flats, searchTerm]);

  // --- Search Logic for History ---
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
      setOwnerName(flat.ownerName || '');
      setMobile(flat.mobile || '');
      setAmount(MAINTENANCE_AMOUNT);
      setPaymentDate(getTodayDateString());
      setStep(2);
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatId) return;

    try {
      const { newState, transaction } = processPayment(
        state,
        selectedFlatId,
        ownerName,
        mobile,
        amount,
        paymentDate // Pass the custom date
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
    if (!editingTx) return;

    try {
      const newState = updateTransaction(state, editingTx.receiptNo, {
        ownerName,
        mobile,
        amount,
        date: paymentDate // Pass the custom date for update
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
      
      // If we delete the receipt we just generated, reset the form
      if (generatedReceipt?.receiptNo === receiptNo) {
        resetForm();
      }
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setOwnerName(tx.ownerName);
    setMobile(tx.mobile);
    setAmount(tx.amount);
    
    // Extract YYYY-MM-DD from ISO string for the date input
    let dateVal = getTodayDateString();
    if (tx.date) {
        try {
            dateVal = new Date(tx.date).toISOString().split('T')[0];
        } catch (e) {
            console.error("Invalid date in transaction", tx.date);
        }
    }
    setPaymentDate(dateVal);
    
    setActiveTab('NEW'); // Re-use the form UI but in edit mode
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
    if (onClearEdit) onClearEdit();
  };

  const renderTabs = () => (
    <div className="flex p-4 space-x-2 bg-white border-b border-slate-200">
      <button
        onClick={() => { setActiveTab('NEW'); resetForm(); }}
        className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center space-x-2 ${activeTab === 'NEW' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
      >
        <PlusCircle size={16} />
        <span>Collect</span>
      </button>
      <button
        onClick={() => { setActiveTab('HISTORY'); resetForm(); }}
        className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center space-x-2 ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
      >
        <History size={16} />
        <span>History</span>
      </button>
    </div>
  );

  // --- VIEW: HISTORY ---
  if (activeTab === 'HISTORY') {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        {renderTabs()}
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search receipt, flat, or name..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3 pb-20">
            {filteredHistory.length === 0 ? (
               <div className="text-center text-slate-400 mt-10">
                <p>No transactions found.</p>
              </div>
            ) : (
              filteredHistory.map(tx => (
                <div key={tx.receiptNo} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-lg text-slate-800">{tx.flatNumber}</span>
                      <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">#{tx.receiptNo}</span>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(tx.amount)}</span>
                  </div>
                  
                  <div className="text-sm text-slate-500 mb-4 space-y-1">
                    <p>{tx.ownerName}</p>
                    <p className="text-xs">{formatDate(tx.date)}</p>
                  </div>

                  <div className="flex space-x-3 pt-3 border-t border-slate-100">
                    <button 
                      onClick={() => startEdit(tx)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(tx.receiptNo)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100"
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

  // Editing Mode or Payment Step 2
  if (step === 2 || editingTx) {
    const title = editingTx ? `Edit Receipt #${editingTx.receiptNo}` : 'Payment Details';
    const flatNum = editingTx ? editingTx.flatNumber : state.flats.find(f => f.id === selectedFlatId)?.flatNumber;

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="p-4">
          <button onClick={resetForm} className="text-sm text-blue-600 font-medium mb-4">&larr; Cancel</button>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">{title}</h2>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <p className="text-sm text-blue-600 mb-1">Flat Number</p>
            <p className="text-2xl font-bold text-blue-900">{flatNum}</p>
          </div>

          <form onSubmit={editingTx ? handleUpdateTransaction : handlePayment} className="space-y-4">
            
            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
              <input
                required
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                placeholder="Enter owner name"
              />
            </div>
            
            {/* Mobile Number - OPTIONAL now */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number (Optional)</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                placeholder="e.g. 9876543210"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
              <input
                required
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
              >
                {editingTx ? 'Update Receipt' : 'Collect & Generate Receipt'}
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
    <div className="p-4 flex flex-col items-center justify-center h-full text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={40} />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful</h2>
      <p className="text-slate-500 mb-8">Receipt #{generatedReceipt?.receiptNo} Generated</p>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full mb-8 text-left">
        <div className="flex justify-between mb-2">
          <span className="text-slate-500">Amount</span>
          <span className="font-bold text-slate-900">{formatCurrency(generatedReceipt!.amount)}</span>
        </div>
        <div className="text-xs text-slate-400 text-right mb-4 italic">
          {amountToWords(generatedReceipt!.amount)}
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-slate-500">Flat</span>
          <span className="font-medium text-slate-900">{generatedReceipt!.flat}</span>
        </div>
         <div className="flex justify-between mb-2">
          <span className="text-slate-500">Date</span>
          <span className="font-medium text-slate-900">{generatedReceipt!.date}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-slate-500">Mobile</span>
          <span className="font-medium text-slate-900">{generatedReceipt!.mobile || 'N/A'}</span>
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
          className="w-full flex items-center justify-center space-x-2 bg-[#25D366] text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 mb-3"
        >
          <Share2 size={20} />
          <span>Share Receipt on WhatsApp</span>
        </a>
      ) : (
         <button disabled className="w-full flex items-center justify-center space-x-2 bg-slate-200 text-slate-400 font-bold py-3 rounded-xl mb-3 cursor-not-allowed">
            <Share2 size={20} />
            <span>No Mobile for WhatsApp</span>
         </button>
      )}
      
      <button
        onClick={resetForm}
        className="w-full py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 mb-2"
      >
        Close & Collect Another
      </button>
    </div>
  );
  }

  // Default: Step 1 (Search & Select)
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {renderTabs()}
      
      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Select Flat</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search flat number..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pb-20">
          {filteredFlats.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">
              {searchTerm ? <p>No matching unpaid flats found.</p> : <p>Search for a flat to begin.</p>}
            </div>
          ) : (
            filteredFlats.map(flat => (
              <button
                key={flat.id}
                onClick={() => handleSelectFlat(flat.id)}
                className="w-full flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm active:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <span className="text-lg font-bold text-slate-800">{flat.flatNumber}</span>
                  {flat.ownerName && <span className="block text-sm text-slate-500">{flat.ownerName}</span>}
                </div>
                <div className="bg-slate-100 p-2 rounded-full text-slate-400">
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
