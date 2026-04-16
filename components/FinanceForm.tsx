
import React, { useState, useEffect } from 'react';
import { AppState, FinancialRecord } from '../types';
import { addFinancialRecord, updateFinancialRecord } from '../services/storageService';
import { parseFinancialText } from '../services/geminiService';
import { Sparkles, X, Plus, ArrowRightLeft } from 'lucide-react';
import { getTodayDateString } from '../utils/helpers';

interface FinanceFormProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
  onClose: () => void;
  recordToEdit?: FinancialRecord | null;
}

const FinanceForm: React.FC<FinanceFormProps> = ({ state, refreshState, onClose, recordToEdit }) => {
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK'>('CASH');
  const [date, setDate] = useState(getTodayDateString());
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [vendorId, setVendorId] = useState('');
  
  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setType(recordToEdit.type as any);
      setPaymentMode(recordToEdit.paymentMode || 'CASH');
      try {
        setDate(new Date(recordToEdit.date).toISOString().split('T')[0]);
      } catch(e) {
        setDate(getTodayDateString());
      }
      setAmount(recordToEdit.amount);
      setCategory(recordToEdit.category);
      setDescription(recordToEdit.description);
      setVendorId(recordToEdit.vendorId || '');
    }
  }, [recordToEdit]);

  const handleAiQuickFill = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    const result = await parseFinancialText(aiInput);
    setIsAiLoading(false);

    if (result) {
      if (result.type) setType(result.type.toUpperCase() as any);
      if (result.amount) setAmount(result.amount);
      if (result.date) setDate(result.date);
      if (result.category) setCategory(result.category);
      if (result.description) setDescription(result.description);
      if (result.paymentMode) setPaymentMode(result.paymentMode.toUpperCase() as any);
    } else {
      alert("Could not understand the text. Please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    if (recordToEdit) {
      const newState = updateFinancialRecord(state, recordToEdit.id, {
        type,
        paymentMode,
        date,
        amount: Number(amount),
        category: type === 'TRANSFER' ? 'Internal Transfer' : category,
        description,
        vendorId: type === 'EXPENSE' && vendorId ? vendorId : undefined
      });
      refreshState(newState);
    } else {
      const newState = addFinancialRecord(state, {
        type,
        paymentMode,
        date,
        amount: Number(amount),
        category: type === 'TRANSFER' ? 'Internal Transfer' : category,
        description,
        vendorId: type === 'EXPENSE' && vendorId ? vendorId : undefined
      });
      refreshState(newState);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
           <h3 className="font-bold text-xl text-slate-800 dark:text-white">{recordToEdit ? 'Edit Record' : 'New Transaction'}</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
           
           {/* AI Quick Fill Section */}
           {!recordToEdit && (
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <label className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center mb-2">
                   <Sparkles size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                   AI Quick Fill
                </label>
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder='e.g., "Paid 5000 Cash for repairs"'
                      className="flex-1 text-sm px-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 focus:outline-none focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
                   />
                   <button 
                      onClick={handleAiQuickFill}
                      disabled={isAiLoading}
                      className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                   >
                      {isAiLoading ? '...' : 'Auto-Fill'}
                   </button>
                </div>
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Type Selection */}
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Transaction Type</label>
                 <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
                    <button
                       type="button"
                       onClick={() => setType('INCOME')}
                       className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                          type === 'INCOME' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                       }`}
                    >
                       Income
                    </button>
                    <button
                       type="button"
                       onClick={() => setType('EXPENSE')}
                       className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ml-1 ${
                          type === 'EXPENSE' 
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                       }`}
                    >
                       Expense
                    </button>
                    <button
                       type="button"
                       onClick={() => setType('TRANSFER')}
                       className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ml-1 ${
                          type === 'TRANSFER' 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                       }`}
                    >
                       Transfer
                    </button>
                 </div>
              </div>

              {/* Payment Mode (or Source for Transfer) */}
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {type === 'TRANSFER' ? 'Transfer From (Source)' : 'Payment Mode'}
                 </label>
                 <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
                    <button
                       type="button"
                       onClick={() => setPaymentMode('CASH')}
                       className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                          paymentMode === 'CASH' 
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                       }`}
                    >
                       CASH
                    </button>
                    <button
                       type="button"
                       onClick={() => setPaymentMode('BANK')}
                       className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ml-1 ${
                          paymentMode === 'BANK' 
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                       }`}
                    >
                       BANK
                    </button>
                 </div>
                 {type === 'TRANSFER' && (
                     <div className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400 flex items-center justify-center">
                        <ArrowRightLeft size={12} className="mr-1" />
                        Transferring to <strong>{paymentMode === 'CASH' ? 'BANK' : 'CASH'}</strong>
                     </div>
                 )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date</label>
                    <input 
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Amount (₹)</label>
                    <input 
                      type="number"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                 </div>
              </div>

              {/* Category (Hidden for Transfer) */}
              {type !== 'TRANSFER' && (
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <input 
                      type="text"
                      required={type !== 'TRANSFER'}
                      list="categories"
                      placeholder="Select or type category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                    <datalist id="categories">
                       <option value="Maintenance" />
                       <option value="Water Tanker" />
                       <option value="Electricity" />
                       <option value="Security Salary" />
                       <option value="Cleaning" />
                       <option value="Repairs" />
                       <option value="Festival" />
                       <option value="Stationery" />
                       <option value="Legal" />
                       <option value="Miscellaneous" />
                    </datalist>
                 </div>
              )}

              {/* Vendor Selection (Only for EXPENSE) */}
              {type === 'EXPENSE' && state.vendors && state.vendors.length > 0 && (
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Link to Vendor (Optional)</label>
                    <select 
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">-- No Vendor --</option>
                      {state.vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                      ))}
                    </select>
                 </div>
              )}

              {/* Description */}
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                 <input 
                   type="text"
                   placeholder={type === 'TRANSFER' ? "e.g., Deposit to Bank" : "Brief description"}
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                 />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800 mt-2">
                 <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all flex items-center"
                 >
                    <Plus size={18} className="mr-2" />
                    {recordToEdit ? 'Update' : type === 'TRANSFER' ? 'Transfer Funds' : 'Add Transaction'}
                 </button>
              </div>

           </form>
        </div>

      </div>
    </div>
  );
};

export default FinanceForm;
