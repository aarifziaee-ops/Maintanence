
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, PaymentStatus, Transaction } from '../types';
import { processPayment, deleteTransaction, updateTransaction, getNextReceiptNoForMonth } from '../services/storageService';
import { generateWhatsAppLink, amountToWords, formatDate, formatCurrency, getTodayDateString, calculateMaintenanceForMonth } from '../utils/helpers';
import { CheckCircle2, Share2, Search, ArrowRight, Trash2, Edit2, History, PlusCircle, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
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
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK'>('CASH');
  const [manualReceiptNo, setManualReceiptNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Preview Receipt No
  const [previewReceiptNo, setPreviewReceiptNo] = useState<number>(1);

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
    paymentMode: 'CASH' | 'BANK';
    isDuplicate?: boolean;
    remarks?: string;
  } | null>(null);

  // Update preview receipt number whenever paymentDate changes
  useEffect(() => {
      if (!editingTx) {
          const nextNo = getNextReceiptNoForMonth(state, paymentDate);
          setPreviewReceiptNo(nextNo);
      }
  }, [paymentDate, state, editingTx]);

  // Handle incoming edit request from props
  useEffect(() => {
    if (initialTransactionToEdit) {
      startEdit(initialTransactionToEdit);
    }
  }, [initialTransactionToEdit]);

  // Auto-update amount when selected flat or date changes (only if it's a new payment)
  useEffect(() => {
    if (selectedFlatId && !editingTx && paymentDate) {
      const flat = state.flats.find(f => f.id === selectedFlatId);
      if (flat) {
         const targetYear = parseInt(paymentDate.split('-')[0]);
         const targetMonth = parseInt(paymentDate.split('-')[1]);
         setAmount(calculateMaintenanceForMonth(flat, targetYear, targetMonth));
      }
    }
  }, [selectedFlatId, paymentDate, state.flats, editingTx]);

  // --- Search Logic ---
  const filteredFlats = useMemo(() => {
    return state.flats.filter(flat => 
      (flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
       flat.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [state.flats, searchTerm]);

  const filteredHistory = useMemo(() => {
    return state.transactions.filter(tx => 
      tx.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNo.toString().includes(searchTerm)
    );
  }, [state.transactions, searchTerm]);

  // Check if selected flat has already paid for the selected month
  const isPaidForMonth = useMemo(() => {
      if (!selectedFlatId || editingTx) return false;
      const monthPrefix = paymentDate.substring(0, 7);
      return state.transactions.some(t => t.flatId === selectedFlatId && t.date.startsWith(monthPrefix));
  }, [selectedFlatId, paymentDate, state.transactions, editingTx]);

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
    
    if (isPaidForMonth) {
        if(!window.confirm("This flat has already paid for this month. Do you want to generate another receipt?")) {
            return;
        }
    }

    const cleanMobile = sanitizeMobile(mobile);

    try {
      const { newState, transaction } = processPayment(
        state,
        selectedFlatId,
        ownerName,
        cleanMobile,
        amount,
        paymentDate,
        paymentMode,
        manualReceiptNo ? parseInt(manualReceiptNo, 10) : undefined,
        remarks || undefined
      );
      
      refreshState(newState);
      setGeneratedReceipt({
        receiptNo: transaction.receiptNo,
        date: formatDate(transaction.date),
        amount: transaction.amount,
        name: transaction.ownerName,
        flat: transaction.flatNumber,
        mobile: transaction.mobile,
        paymentMode: transaction.paymentMode || 'CASH',
        isDuplicate: false,
        remarks: transaction.remarks
      });
      setStep(3);
    } catch (error) {
      alert("Error processing payment");
    }
  };

  const viewReceipt = (tx: Transaction) => {
    setGeneratedReceipt({
      receiptNo: tx.receiptNo,
      date: formatDate(tx.date),
      amount: tx.amount,
      name: tx.ownerName,
      flat: tx.flatNumber,
      mobile: tx.mobile,
      paymentMode: tx.paymentMode || 'CASH',
      isDuplicate: true,
      remarks: tx.remarks
    });
    setStep(3);
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
        flatNumber: flat?.flatNumber || editingTx.flatNumber,
        paymentMode,
        remarks: remarks || undefined
      });
      refreshState(newState);
      
      setGeneratedReceipt({
        receiptNo: editingTx.receiptNo,
        date: formatDate(paymentDate),
        amount: amount,
        name: ownerName,
        flat: flat?.flatNumber || editingTx.flatNumber,
        mobile: cleanMobile,
        paymentMode,
        isDuplicate: true,
        remarks: remarks || undefined
      });
      setStep(3);
      setEditingTx(null);
    } catch (error) {
      alert("Failed to update transaction");
    }
  };

  const handleDelete = (tx: Transaction) => {
    if (window.confirm(`Are you sure you want to delete Receipt #${tx.receiptNo} from ${tx.date}?\nThis will mark the flat as UNPAID.`)) {
      const newState = deleteTransaction(state, tx.receiptNo, tx.date);
      refreshState(newState);
      if (generatedReceipt?.receiptNo === tx.receiptNo) resetForm();
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setSelectedFlatId(tx.flatId);
    setOwnerName(tx.ownerName);
    setMobile(tx.mobile);
    setAmount(tx.amount);
    setPaymentMode(tx.paymentMode || 'CASH');
    setRemarks(tx.remarks || '');
    setManualReceiptNo('');
    
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
    setPaymentMode('CASH');
    setRemarks('');
    setManualReceiptNo('');
    setGeneratedReceipt(null);
    setEditingTx(null);
    setIsChangingFlat(false);
    if (onClearEdit) onClearEdit();
  };

  const handleShareImage = async () => {
    const element = document.getElementById('receipt-card');
    if (!element) return;
    
    const btn = document.getElementById('share-img-btn');
    if(btn) btn.textContent = 'Processing...';

    try {
        // @ts-ignore
        if (!window.html2canvas) {
            alert("Image generation library is loading. Please try again in 2 seconds.");
            if(btn) btn.textContent = 'Share Receipt Image';
            return;
        }

        // @ts-ignore
        const canvas = await window.html2canvas(element, {
            scale: 2.5, // High resolution
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false
        });

        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) return;
            const imageUrl = URL.createObjectURL(blob);

            // 1. Always Download Image first (so user has it)
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `Receipt_${generatedReceipt?.receiptNo}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 2. If mobile exists, open specific WhatsApp chat
            if (generatedReceipt?.mobile) {
                const waLink = generateWhatsAppLink(
                    generatedReceipt.mobile,
                    generatedReceipt.receiptNo,
                    generatedReceipt.name,
                    generatedReceipt.flat,
                    generatedReceipt.amount,
                    generatedReceipt.date
                );
                
                // Open WhatsApp after small delay
                setTimeout(() => {
                    window.open(waLink, '_blank');
                    alert("Receipt Image Downloaded!\n\nWhatsApp chat opened.\n\nPlease attach the downloaded image to the chat.");
                    if(btn) btn.textContent = 'Share Receipt Image';
                }, 800);

            } else {
                // Fallback: System Share Sheet
                const file = new File([blob], `Receipt_${generatedReceipt?.receiptNo}.png`, { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Payment Receipt #${generatedReceipt?.receiptNo}`,
                            text: `Payment Receipt for Flat ${generatedReceipt?.flat}`
                        });
                    } catch (error) {
                        // User cancelled
                    }
                }
                if(btn) btn.textContent = 'Share Receipt Image';
            }
        }, 'image/png');

    } catch (error) {
        console.error("Receipt generation failed", error);
        alert("Failed to generate image.");
        if(btn) btn.textContent = 'Share Receipt Image';
    }
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
                <div key={`${tx.receiptNo}-${tx.date}`} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
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
                    {tx.remarks && <p className="text-xs italic">Remarks: {tx.remarks}</p>}
                  </div>

                  <div className="flex space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => viewReceipt(tx)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium text-sm hover:bg-green-100 dark:hover:bg-green-900/40"
                    >
                      <ImageIcon size={16} />
                      <span>Receipt</span>
                    </button>
                    <button 
                      onClick={() => startEdit(tx)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(tx)}
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
        <div className="p-4 flex-1 overflow-y-auto pb-24">
          <button onClick={resetForm} className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-4 flex items-center">
             &larr; Cancel
          </button>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
            {!editingTx && (
                <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-500">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt No</span>
                    <span className="bg-yellow-400 text-black text-2xl font-black px-4 py-2 rounded-xl shadow-lg border-2 border-yellow-200 transform -rotate-2">
                        #{previewReceiptNo}
                    </span>
                </div>
            )}
          </div>
          
          {isPaidForMonth && !editingTx && (
             <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start">
                 <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mr-2 mt-0.5 shrink-0" />
                 <p className="text-xs text-amber-700 dark:text-amber-300">
                     <strong>Warning:</strong> This flat has already recorded a payment for {new Date(paymentDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
                 </p>
             </div>
          )}
          
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Manual Receipt No. (Optional)</label>
                <input
                  type="number"
                  value={manualReceiptNo}
                  onChange={(e) => setManualReceiptNo(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  placeholder={editingTx ? editingTx.receiptNo.toString() : "Blank = Auto"}
                  disabled={!!editingTx}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Period / Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  placeholder="e.g. May-June 2026"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Payment Mode</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paymentMode" 
                    value="CASH" 
                    checked={paymentMode === 'CASH'} 
                    onChange={() => setPaymentMode('CASH')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cash</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paymentMode" 
                    value="BANK" 
                    checked={paymentMode === 'BANK'} 
                    onChange={() => setPaymentMode('BANK')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bank Trf</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 dark:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 size={20} />
                <span>{editingTx ? 'Update Receipt' : `Generate Receipt #${previewReceiptNo}`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Success View (Step 3) - RECEIPT PREVIEW & SHARE
  if (step === 3 && generatedReceipt) {
     return (
    <div className="p-4 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors overflow-y-auto">
      
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Payment Recorded</h2>
      </div>

      {/* RECEIPT CARD TO CAPTURE */}
      <div className="flex justify-center mb-6">
          <div 
            id="receipt-card"
            className="bg-white w-full max-w-sm p-6 rounded-none shadow-xl border-t-4 border-blue-600 relative overflow-hidden text-slate-900"
            style={{ minHeight: '400px' }}
          >
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-slate-100 pb-4 mb-4 relative">
                  {generatedReceipt.isDuplicate && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex items-center justify-center pointer-events-none opacity-10">
                          <span className="text-5xl font-black text-slate-900 transform -rotate-12 tracking-widest">DUPLICATE</span>
                      </div>
                  )}
                  <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">Continental Heights</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">B Wing • Maintenance Receipt</p>
              </div>

              {/* Amount */}
              <div className="text-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Amount Paid</p>
                  <h2 className="text-3xl font-black text-slate-900">{formatCurrency(generatedReceipt.amount)}</h2>
                  <p className="text-[9px] text-slate-500 italic mt-1">{amountToWords(generatedReceipt.amount)}</p>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm mb-8">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 items-center">
                      <span className="text-slate-500 font-medium text-sm">Receipt No</span>
                      {/* UPDATED: Bigger Receipt Number */}
                      <span className="font-black text-slate-900 text-3xl">#{generatedReceipt.receiptNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Date</span>
                      <span className="font-bold text-slate-900">{generatedReceipt.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Flat No</span>
                      <span className="font-black text-lg text-slate-900">{generatedReceipt.flat}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Received From</span>
                      <span className="font-bold text-slate-900 text-right w-1/2 leading-tight">{generatedReceipt.name}</span>
                  </div>
                  {generatedReceipt.remarks && (
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 pt-2">
                        <span className="text-slate-500 font-medium">Remarks</span>
                        <span className="font-bold text-slate-900 text-right w-1/2 leading-tight">{generatedReceipt.remarks}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 pt-2">
                      <span className="text-slate-500 font-medium">Payment Mode</span>
                      <span className="font-bold text-slate-900">{generatedReceipt.paymentMode === 'BANK' ? 'BANK TRF' : 'CASH'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6">
                      <span className="text-slate-500 font-medium">Status</span>
                      {/* UPDATED: Embossed Green Stamp Look */}
                      <div className="border-4 border-green-700 text-green-700 font-serif font-black text-2xl px-6 py-2 rounded-lg transform -rotate-12 opacity-80 tracking-widest" style={{
                          textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                          boxShadow: 'inset 0 0 20px rgba(21, 128, 61, 0.1)'
                      }}>
                          PAID
                      </div>
                  </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-4 border-t-2 border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Authorized Signature</p>
                  <p className="text-[8px] text-slate-300 mt-4">Computer Generated Receipt</p>
              </div>
              
              {/* Decorative Circles */}
              <div className="absolute -left-3 top-1/2 w-6 h-6 bg-slate-100 rounded-full"></div>
              <div className="absolute -right-3 top-1/2 w-6 h-6 bg-slate-100 rounded-full"></div>
          </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="space-y-3 pb-24 max-w-sm mx-auto w-full">
        <button
          id="share-img-btn"
          onClick={handleShareImage}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all"
        >
          <ImageIcon size={20} />
          <span>Share Receipt Image</span>
        </button>

        {generatedReceipt.mobile ? (
            <a
            href={generateWhatsAppLink(
                generatedReceipt.mobile,
                generatedReceipt.receiptNo,
                generatedReceipt.name,
                generatedReceipt.flat,
                generatedReceipt.amount,
                generatedReceipt.date
            )}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
            <Share2 size={20} />
            <span>Send Text Message Only</span>
            </a>
        ) : null}
        
        <button
            onClick={resetForm}
            className="w-full py-3 text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
            Close
        </button>
      </div>
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
