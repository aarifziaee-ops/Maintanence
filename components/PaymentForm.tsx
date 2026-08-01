
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, PaymentStatus, Transaction } from '../types';
import { processPayment, deleteTransaction, updateTransaction, getNextReceiptNoForMonth, saveData } from '../services/storageService';
import { generateWhatsAppLink, amountToWords, formatDate, formatCurrency, getTodayDateString, calculateMaintenanceForMonth, getTransactionsForMonth, getOutstandingBreakdown } from '../utils/helpers';
import { CheckCircle2, Share2, Search, ArrowRight, Trash2, Edit2, History, PlusCircle, AlertCircle, RefreshCw, Image as ImageIcon, Printer, Tag, UserCheck, CreditCard } from 'lucide-react';
import { MAINTENANCE_AMOUNT } from '../constants';
import { FinancialRecord } from '../types';

interface PaymentFormProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
  initialTransactionToEdit?: Transaction | null;
  onClearEdit?: () => void;
}

type TabMode = 'NEW' | 'HISTORY';

const PaymentForm: React.FC<PaymentFormProps> = ({ state, refreshState, initialTransactionToEdit, onClearEdit }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('NEW');
  const [collectionType, setCollectionType] = useState<'MAINTENANCE' | 'OTHER_INCOME'>('MAINTENANCE');
  
  // Other Income State
  const [otherCategory, setOtherCategory] = useState<'Fines' | 'Hall Booking' | 'Service Charges' | 'Promotions' | 'Other'>('Hall Booking');
  const [otherFlatId, setOtherFlatId] = useState<string>('');
  const [manualSourceName, setManualSourceName] = useState<string>('');
  
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
  const [outstandingBalances, setOutstandingBalances] = useState<any[]>([]); // New state
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // Stores indices of selected outstanding balances
  const [selectedAdvanceMonths, setSelectedAdvanceMonths] = useState<string[]>([]); // Stores selected advance month strings

  // Preview Receipt No
  const [previewReceiptNo, setPreviewReceiptNo] = useState<number>(1);

  // Edit Specific
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isChangingFlat, setIsChangingFlat] = useState(false);

  // Custom Confirm Modals
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [showDoublePaymentConfirm, setShowDoublePaymentConfirm] = useState(false);


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
    rawDate?: string;
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

  // Auto-update amount and period remarks when selected flat or date changes (only if it's a new payment)
  useEffect(() => {
    if (selectedFlatId) {
        fetch(`/api/outstanding-balances/${selectedFlatId}`)
            .then(res => res.json())
            .then(data => {
                const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));
                setOutstandingBalances(sorted);
                if (!editingTx) {
                    if (sorted.length > 0) {
                        setSelectedMonths([0]);
                        setAmount(sorted[0].amount);
                        setRemarks(computePeriodRemarks([0], [], sorted, paymentDate));
                    } else {
                        setSelectedMonths([]);
                        const flat = state.flats.find(f => f.id === selectedFlatId);
                        if (flat && paymentDate) {
                            const targetYear = parseInt(paymentDate.split('-')[0]);
                            const targetMonth = parseInt(paymentDate.split('-')[1]);
                            setAmount(calculateMaintenanceForMonth(flat, targetYear, targetMonth));
                        } else {
                            setAmount(MAINTENANCE_AMOUNT);
                        }
                        setRemarks(computePeriodRemarks([], [], [], paymentDate));
                    }
                }
            });
    }
  }, [selectedFlatId, editingTx]);

  useEffect(() => {
    if (selectedFlatId && !editingTx && paymentDate && (!outstandingBalances || outstandingBalances.length === 0)) {
      const flat = state.flats.find(f => f.id === selectedFlatId);
      if (flat) {
         const targetYear = parseInt(paymentDate.split('-')[0]);
         const targetMonth = parseInt(paymentDate.split('-')[1]);
         setAmount(calculateMaintenanceForMonth(flat, targetYear, targetMonth));
      }
    }
  }, [selectedFlatId, paymentDate, state.flats, editingTx, outstandingBalances]);

  // Synchronize checkboxes when the user types an amount manually (greedy selection starting from oldest outstanding month)
  useEffect(() => {
    if (outstandingBalances.length > 0 && !editingTx && selectedAdvanceMonths.length === 0) {
      let currentSum = 0;
      const newSelected: number[] = [];
      for (let i = 0; i < outstandingBalances.length; i++) {
        currentSum += outstandingBalances[i].amount;
        newSelected.push(i);
        if (currentSum === amount) {
          const isSame = selectedMonths.length === newSelected.length && 
                         selectedMonths.every((val, index) => val === newSelected[index]);
          if (!isSame) {
            setSelectedMonths(newSelected);
          }
          return;
        }
        if (currentSum > amount) {
          break;
        }
      }
    }
  }, [amount, outstandingBalances, editingTx, selectedMonths, selectedAdvanceMonths]);

  // --- Search Logic ---
  const filteredFlats = useMemo(() => {
    return state.flats.filter(flat => 
      (flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
       flat.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [state.flats, searchTerm]);

  // Generate list of possible advance months to display
  const advanceMonthsOptions = useMemo(() => {
    if (!selectedFlatId) return [];
    
    // Find latest month either in outstanding or in the current date
    let baseMonthStr = '';
    if (outstandingBalances && outstandingBalances.length > 0) {
      baseMonthStr = outstandingBalances[outstandingBalances.length - 1].month;
    } else {
      baseMonthStr = paymentDate.substring(0, 7); // e.g. '2026-07'
    }
    
    const parts = baseMonthStr.split('-');
    if (parts.length < 2) return [];
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    
    const options = [];
    const ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 1; i <= 3; i++) {
      let nextMonth = month + i;
      let nextYear = year;
      if (nextMonth > 12) {
        nextMonth -= 12;
        nextYear += 1;
      }
      
      const monthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
      const flat = state.flats.find(f => f.id === selectedFlatId);
      const amountVal = flat ? calculateMaintenanceForMonth(flat, nextYear, nextMonth) : 2500;
      
      options.push({
        month: monthStr,
        label: `${ABBRS[nextMonth - 1]} ${nextYear}`,
        amount: amountVal
      });
    }
    return options;
  }, [selectedFlatId, outstandingBalances, paymentDate, state.flats]);

  const computePeriodRemarks = (
    selectedIndices: number[],
    advanceMonths: string[],
    balances: any[],
    fallbackDate: string
  ) => {
    const monthItems: { year: string; monthIdx: number; monthName: string }[] = [];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // 1. Selected outstanding months
    selectedIndices.forEach(idx => {
      if (balances[idx]) {
        const parts = balances[idx].month.split('-');
        if (parts.length === 2) {
          const yr = parts[0];
          const mIdx = parseInt(parts[1], 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            monthItems.push({ year: yr, monthIdx: mIdx, monthName: monthNames[mIdx] });
          }
        }
      }
    });

    // 2. Selected advance months
    advanceMonths.forEach(mStr => {
      const parts = mStr.split('-');
      if (parts.length === 2) {
        const yr = parts[0];
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthItems.push({ year: yr, monthIdx: mIdx, monthName: monthNames[mIdx] });
        }
      }
    });

    if (monthItems.length === 0) {
      const parts = fallbackDate.split('-');
      if (parts.length >= 2) {
        const yr = parts[0];
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          return `Payment for ${monthNames[mIdx]} ${yr}`;
        }
      }
      return '';
    }

    const allSameYear = monthItems.every(item => item.year === monthItems[0].year);
    if (allSameYear) {
      const yr = monthItems[0].year;
      const names = monthItems.map(i => i.monthName);
      if (names.length === 1) return `Payment for ${names[0]} ${yr}`;
      if (names.length === 2) return `Payment for ${names[0]} and ${names[1]} ${yr}`;
      return `Payment for ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]} ${yr}`;
    } else {
      const formatted = monthItems.map(i => `${i.monthName} ${i.year}`);
      if (formatted.length === 1) return `Payment for ${formatted[0]}`;
      if (formatted.length === 2) return `Payment for ${formatted[0]} and ${formatted[1]}`;
      return `Payment for ${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
    }
  };

  const recalculatePaymentDetails = (newSelected: number[], newAdvance: string[]) => {
    setSelectedMonths(newSelected);
    setSelectedAdvanceMonths(newAdvance);

    // Calculate sum of outstanding months
    const outstandingSum = newSelected.reduce((sum, idx) => sum + (outstandingBalances[idx]?.amount || 0), 0);
    
    // Calculate sum of advance months
    const advanceSum = newAdvance.reduce((sum, monthStr) => {
      const opt = advanceMonthsOptions.find(o => o.month === monthStr);
      return sum + (opt ? opt.amount : 0);
    }, 0);

    const totalSum = outstandingSum + advanceSum;
    setAmount(totalSum);

    setRemarks(computePeriodRemarks(newSelected, newAdvance, outstandingBalances, paymentDate));
  };

  const filteredHistory = useMemo(() => {
    return [...state.transactions].filter(tx => 
      tx.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNo.toString().includes(searchTerm)
    ).sort((a, b) => b.receiptNo - a.receiptNo);
  }, [state.transactions, searchTerm]);

  
  const isMonthTicked = (monthAbbr: string, remarksText: string) => {
    const rm = (remarksText || '').toLowerCase();
    const mapping: { [key: string]: string[] } = {
      'Apr': ['apr', 'april'],
      'May': ['may'],
      'Jun': ['jun', 'june'],
      'Jul': ['jul', 'july'],
      'Aug': ['aug', 'august'],
      'Sep': ['sep', 'sept', 'september'],
      'Oct': ['oct', 'october'],
      'Nov': ['nov', 'november'],
      'Dec': ['dec', 'december'],
      'Jan': ['jan', 'january'],
      'Feb': ['feb', 'february'],
      'Mar': ['mar', 'march']
    };
    const targets = mapping[monthAbbr] || [monthAbbr.toLowerCase()];
    return targets.some(target => {
      const regex = new RegExp(`\\b${target}\\b`, 'i');
      return regex.test(rm);
    });
  };

  const generatePeriodString = (checkedAbbrs: string[], year: string) => {
    if (checkedAbbrs.length === 0) return '';
    const monthFullNames: { [key: string]: string } = {
      'Apr': 'April', 'May': 'May', 'Jun': 'June',
      'Jul': 'July', 'Aug': 'August', 'Sep': 'September',
      'Oct': 'October', 'Nov': 'November', 'Dec': 'December',
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March'
    };
    const selectedFull = checkedAbbrs.map(abbr => monthFullNames[abbr] || abbr);
    if (selectedFull.length === 1) {
      return `Payment for ${selectedFull[0]} ${year}`;
    }
    if (selectedFull.length === 2) {
      return `Payment for ${selectedFull[0]} and ${selectedFull[1]} ${year}`;
    }
    return `Payment for ${selectedFull.slice(0, -1).join(', ')}, and ${selectedFull[selectedFull.length - 1]} ${year}`;
  };

  const getPaymentPeriodText = (remarks?: string, rawDate?: string) => {
    if (remarks && remarks.trim()) {
      return remarks;
    }
    if (rawDate) {
      const parts = rawDate.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const MONTHS = [
          "January", "February", "March", "April", "May", "June", 
          "July", "August", "September", "October", "November", "December"
        ];
        if (monthIdx >= 0 && monthIdx < 12) {
          return `Payment for ${MONTHS[monthIdx]} ${year}`;
        }
      }
    }
    return 'N/A';
  };

  const formatMonthKey = (monthStr: string) => {
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${MONTHS[monthIndex]}-${year.slice(-2)}`;
      }
    }
    return monthStr;
  };

  const outstandingMonthsStr = useMemo(() => {
    if (!outstandingBalances || outstandingBalances.length === 0) return '';
    return outstandingBalances.map(b => formatMonthKey(b.month).toUpperCase()).join(', ');
  }, [outstandingBalances]);

const intendedMonth = useMemo(() => {
     const rm = (remarks || '').toLowerCase();
     const MONTHS_LONG = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
     const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
     
     let foundMonth = -1;
     for (let i=0; i<12; i++) {
         if (rm.includes(MONTHS_LONG[i]) || new RegExp(`\\b${MONTHS_SHORT[i]}\\b`, 'i').test(rm)) {
             foundMonth = i;
             break;
         }
     }
     
     if (foundMonth !== -1) {
         const yearMatch = rm.match(/\b(20\d{2})\b/);
         const yearStr = yearMatch ? yearMatch[1] : paymentDate.substring(0, 4);
         const mStr = (foundMonth + 1).toString().padStart(2, '0');
         return `${yearStr}-${mStr}`;
     }
     return paymentDate.substring(0, 7);
  }, [remarks, paymentDate]);

  // Check if selected flat has already paid for the selected month
  const isPaidForMonth = useMemo(() => {
      if (!selectedFlatId || editingTx) return false;
      const flatTxs = state.transactions.filter(t => t.flatId === selectedFlatId);
      return getTransactionsForMonth(flatTxs, intendedMonth).length > 0;
  }, [selectedFlatId, intendedMonth, state.transactions, editingTx]);

  const handleSelectFlat = (flatId: string) => {
    const flat = state.flats.find(f => f.id === flatId);
    if (flat) {
      setSelectedFlatId(flatId);
      setSelectedMonths([]); // Reset selection
      setSelectedAdvanceMonths([]); // Reset advance selection
      setAmount(MAINTENANCE_AMOUNT); // Reset amount
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

  const executePayment = async () => {
    if (!selectedFlatId) return;
    const cleanMobile = sanitizeMobile(mobile);

    try {
      if (selectedMonths.length > 0) {
        const idsToDelete = selectedMonths.map(idx => outstandingBalances[idx].id);
        const delRes = await fetch('/api/delete-outstanding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: idsToDelete })
        });
        if (!delRes.ok) {
          console.error("Failed to delete paid outstanding months");
        }
      }

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
      
      setGeneratedReceipt({
        receiptNo: transaction.receiptNo,
        date: formatDate(transaction.date),
        amount: transaction.amount,
        name: transaction.ownerName,
        flat: transaction.flatNumber,
        mobile: transaction.mobile,
        paymentMode: transaction.paymentMode || 'CASH',
        isDuplicate: false,
        remarks: transaction.remarks,
        rawDate: transaction.date
      });
      
      await saveData(newState);
      
      const syncRes = await fetch('/api/state');
      if (syncRes.ok) {
        const syncedData = await syncRes.json();
        refreshState(syncedData);
      } else {
        refreshState(newState);
      }
      
      setStep(3);
    } catch (error) {
      alert("Error processing payment");
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatId) return;
    
    if (isPaidForMonth) {
        setShowDoublePaymentConfirm(true);
        return;
    }
    executePayment();
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
      remarks: tx.remarks,
      rawDate: tx.date
    });
    setStep(3);
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !selectedFlatId) return;

    const cleanMobile = sanitizeMobile(mobile);
    const flat = state.flats.find(f => f.id === selectedFlatId);

    try {
      const newState = updateTransaction(state, editingTx.id, {
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
        remarks: remarks || undefined,
        rawDate: paymentDate
      });
      setStep(3);
      setEditingTx(null);
    } catch (error) {
      alert("Failed to update transaction");
    }
  };

  const handleDelete = (tx: Transaction) => {
    setTxToDelete(tx);
  };

  const confirmDelete = () => {
    if (!txToDelete) return;
    try {
      const newState = deleteTransaction(state, txToDelete.id);
      refreshState(newState);
      if (generatedReceipt?.receiptNo === txToDelete.receiptNo) resetForm();
      setTxToDelete(null);
    } catch (error: any) {
      alert("Error deleting transaction: " + error.message);
      console.error(error);
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

  const handleOtherFlatChange = (flatId: string) => {
    setOtherFlatId(flatId);
    const flat = state.flats.find(f => f.id === flatId);
    if (flat) {
      if (!manualSourceName) {
        setManualSourceName(flat.ownerName);
      }
      if (!mobile) {
        setMobile(flat.mobile || '');
      }
    }
  };

  const handleOtherIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    let finalFlatId = 'OTHER_INCOME';
    let finalFlatNumber = `[${otherCategory}]`;
    let finalOwnerName = manualSourceName.trim();
    let cleanMobile = mobile ? mobile.replace(/\D/g, '').slice(-10) : '';

    if (otherFlatId) {
      const flat = state.flats.find(f => f.id === otherFlatId);
      if (flat) {
        finalFlatId = flat.id;
        finalFlatNumber = flat.flatNumber;
        if (!finalOwnerName) {
          finalOwnerName = flat.ownerName;
        }
        if (!cleanMobile) {
          cleanMobile = flat.mobile ? flat.mobile.replace(/\D/g, '').slice(-10) : '';
        }
      }
    }

    if (!finalOwnerName) {
      alert("Please enter a manual source name/company or select a flat number.");
      return;
    }

    const categoryRemarks = `[${otherCategory}]${remarks.trim() ? ` - ${remarks.trim()}` : ''}`;

    try {
      const { newState, transaction } = processPayment(
        state,
        finalFlatId,
        finalOwnerName,
        cleanMobile,
        numAmount,
        paymentDate,
        paymentMode,
        manualReceiptNo ? parseInt(manualReceiptNo, 10) : undefined,
        categoryRemarks
      );

      // Create corresponding FinancialRecord for society income logging
      const finRecord: FinancialRecord = {
        id: `fin-${Date.now()}`,
        type: 'INCOME',
        paymentMode,
        amount: numAmount,
        date: paymentDate,
        category: otherCategory,
        description: `Receipt #${transaction.receiptNo} - ${finalOwnerName}${remarks.trim() ? ` (${remarks.trim()})` : ''}`,
        timestamp: Date.now()
      };

      const updatedStateWithFinance = {
        ...newState,
        financialRecords: [finRecord, ...newState.financialRecords]
      };

      setGeneratedReceipt({
        receiptNo: transaction.receiptNo,
        date: formatDate(transaction.date),
        amount: transaction.amount,
        name: transaction.ownerName,
        flat: transaction.flatNumber,
        mobile: transaction.mobile,
        paymentMode: transaction.paymentMode || 'CASH',
        isDuplicate: false,
        remarks: transaction.remarks,
        rawDate: transaction.date
      });

      await saveData(updatedStateWithFinance);

      const syncRes = await fetch('/api/state');
      if (syncRes.ok) {
        const syncedData = await syncRes.json();
        refreshState(syncedData);
      } else {
        refreshState(updatedStateWithFinance);
      }

      setStep(3);
    } catch (error) {
      console.error("Error submitting other income:", error);
      alert("Failed to submit income entry.");
    }
  };

  const resetForm = () => {
    setStep(1);
    setSearchTerm('');
    setSelectedFlatId(null);
    setSelectedMonths([]); // Reset selection
    setSelectedAdvanceMonths([]); // Reset advance selection
    setOwnerName('');
    setMobile('');
    setAmount(MAINTENANCE_AMOUNT);
    setPaymentDate(getTodayDateString());
    setPaymentMode('CASH');
    setRemarks('');
    setManualReceiptNo('');
    setOtherCategory('Hall Booking');
    setOtherFlatId('');
    setManualSourceName('');
    setGeneratedReceipt(null);
    setEditingTx(null);
    setIsChangingFlat(false);
    if (onClearEdit) onClearEdit();
  };

  const handleShareImage = async () => {
    const element = document.getElementById('receipt-card');
    if (!element) return;
    
    const btn = document.getElementById('share-img-btn');
    if (btn) btn.textContent = 'Generating Image...';

    // Use setTimeout so button text updates immediately to "Generating Image..."
    setTimeout(async () => {
      try {
        // @ts-ignore
        if (!window.html2canvas) {
            alert("Image generation library is loading. Please try again in 2 seconds.");
            if(btn) btn.textContent = 'Share Receipt Image';
            return;
        }

        // @ts-ignore
        const canvas = await window.html2canvas(element, {
            scale: 1.25, // Optimized high resolution with fast capture speed
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            removeContainer: true
        });

        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) {
                if (btn) btn.textContent = 'Share Receipt Image';
                return;
            }
            const imageUrl = URL.createObjectURL(blob);

            // 1. Always Download Image first
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
                
                setTimeout(() => {
                    window.open(waLink, '_blank');
                    alert("Receipt Image Downloaded!\n\nWhatsApp chat opened.\n\nPlease attach the downloaded image to the chat.");
                    if (btn) btn.textContent = 'Share Receipt Image';
                }, 400);

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
                if (btn) btn.textContent = 'Share Receipt Image';
            }
        }, 'image/png');

      } catch (error) {
        console.error("Receipt generation failed", error);
        alert("Failed to generate image.");
        if (btn) btn.textContent = 'Share Receipt Image';
      }
    }, 50);
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

  const renderModals = () => (
    <>
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Receipt?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete Receipt #{txToDelete.receiptNo} from {txToDelete.date}? This will mark the flat as UNPAID if no other receipts exist for that month.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDoublePaymentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Double Payment Warning</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This flat has already paid for this month. Do you want to generate another receipt?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDoublePaymentConfirm(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDoublePaymentConfirm(false);
                  executePayment();
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // --- VIEW: HISTORY ---
  if (activeTab === 'HISTORY') {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
        {renderModals()}
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
                <div key={`${tx.receiptNo}-${tx.date}-${tx.timestamp || tx.amount}`} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
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
        {renderModals()}
        <div className="p-4 flex-1 overflow-y-auto pb-24">
          <button onClick={resetForm} className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-4 flex items-center">
             &larr; Cancel
          </button>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
            {!editingTx && (
                <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-500 w-[250px]">
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
                     <strong>Warning:</strong> This flat has already recorded a payment for {new Date(intendedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
                 </p>
             </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-6 flex justify-between items-center group w-[650px]">
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
            <div className="w-[670px]">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Owner Name</label>
              <input
                required
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-[650px] px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                placeholder="Enter owner name"
              />
            </div>
            
            <div className="w-[300px]">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Mobile (Optional)</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-[200px] px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="w-[150px]">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Date</label>
                <input
                  required
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-[150px] px-3 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Outstanding Months</label>
                <div className="space-y-2">
                    {outstandingBalances.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No outstanding months</p>
                    ) : (
                        outstandingBalances.map((b, index) => (
                            <label key={b.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedMonths.includes(index)}
                                    onChange={(e) => {
                                        let newSelected;
                                        if (e.target.checked) {
                                            newSelected = [...selectedMonths, index];
                                        } else {
                                            newSelected = selectedMonths.filter(i => i !== index);
                                        }
                                        recalculatePaymentDetails(newSelected, selectedAdvanceMonths);
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{formatMonthKey(b.month)} - ₹{b.amount}</span>
                            </label>
                        ))
                    )}
                </div>

                {/* Advance Months (Optional) */}
                {advanceMonthsOptions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-2">Advance Months (Optional)</label>
                    <div className="space-y-2">
                        {advanceMonthsOptions.map((opt) => (
                            <label key={opt.month} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedAdvanceMonths.includes(opt.month)}
                                    onChange={(e) => {
                                        let newAdvance;
                                        if (e.target.checked) {
                                            newAdvance = [...selectedAdvanceMonths, opt.month];
                                        } else {
                                            newAdvance = selectedAdvanceMonths.filter(m => m !== opt.month);
                                        }
                                        recalculatePaymentDetails(selectedMonths, newAdvance);
                                    }}
                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                                />
                                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded text-xs">
                                    {opt.label} (Advance) - ₹{opt.amount}
                                </span>
                            </label>
                        ))}
                    </div>
                  </div>
                )}
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
                  className="w-[150px] px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  placeholder={editingTx ? editingTx.receiptNo.toString() : "Blank = Auto"}
                  disabled={!!editingTx}
                />
              </div>
              
              <div className="w-[175px]">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1 w-[100px]">Period / Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-[175px] px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  placeholder="e.g. May-June 2026"
                />
                
                {outstandingMonthsStr && !editingTx && (
                  <p className="text-[10px] font-bold text-red-500 dark:text-red-400 mt-1.5 ml-1 flex items-center">
                    <AlertCircle size={10} className="mr-1" />
                    Pending: {outstandingMonthsStr}
                  </p>
                )}
              </div>

            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1 w-[300px]">Payment Mode</label>
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
      {renderModals()}
      
      <div className="flex flex-col items-center justify-center text-center mb-6 no-print">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Payment Recorded</h2>
      </div>

      {/* RECEIPT CARD TO CAPTURE */}
      <div className="flex justify-center mb-6" id="printable-section">
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
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 pt-2">
                      <span className="text-slate-500 font-medium">Payment Period</span>
                      <span className="font-black text-slate-900 text-right w-1/2 leading-tight">
                          {getPaymentPeriodText(generatedReceipt.remarks, generatedReceipt.rawDate)}
                      </span>
                  </div>
                  {generatedReceipt.remarks && generatedReceipt.remarks.trim() !== getPaymentPeriodText(generatedReceipt.remarks, generatedReceipt.rawDate) && (
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
      <div className="space-y-3 pb-24 max-w-sm mx-auto w-full no-print">
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
        >
          <Printer size={20} />
          <span>Print Receipt</span>
        </button>

        <button
          id="share-img-btn"
          onClick={handleShareImage}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all"
        >
          <ImageIcon size={20} />
          <span>Share Receipt Image (WhatsApp)</span>
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

  // STEP 1: SEARCH & SELECT OR OTHER INCOME
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
      {renderModals()}
      {renderTabs()}
      
      <div className="p-4 flex flex-col flex-1 overflow-y-auto pb-24">
        {/* Toggle between Maintenance and Other Income */}
        {!editingTx && (
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl mb-5 shadow-inner">
            <button
              type="button"
              onClick={() => setCollectionType('MAINTENANCE')}
              className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                collectionType === 'MAINTENANCE'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Maintenance Collection
            </button>
            <button
              type="button"
              onClick={() => setCollectionType('OTHER_INCOME')}
              className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                collectionType === 'OTHER_INCOME'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Other Income Receipt
            </button>
          </div>
        )}

        {collectionType === 'MAINTENANCE' ? (
          <>
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
            
            <div className="space-y-2.5">
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
                      <div className="min-w-0">
                        <span className="text-lg font-bold text-slate-800 dark:text-white block leading-tight">{flat.flatNumber}</span>
                        {flat.ownerName && <span className="block text-sm text-slate-500 dark:text-slate-400 break-words whitespace-normal">{flat.ownerName}</span>}
                      </div>
                    </div>
                    <div className="text-slate-300 dark:text-slate-600">
                      <ArrowRight size={20} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          /* OTHER INCOME FORM */
          <div className="bg-amber-50/60 dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-amber-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex justify-between items-start border-b border-amber-200/60 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-amber-900 dark:text-amber-400 tracking-wide uppercase">OTHER INCOME</h2>
                <p className="text-xs font-medium text-amber-800/80 dark:text-amber-500/80 mt-0.5">Issue numbered receipts for hall booking, promotions, fines, etc.</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-amber-800/60 dark:text-amber-400/60 uppercase tracking-widest mb-1">Receipt No</span>
                <span className="bg-yellow-400 text-black text-2xl font-black px-4 py-1.5 rounded-xl shadow-md border-2 border-yellow-300 transform -rotate-1">
                  #{previewReceiptNo}
                </span>
              </div>
            </div>

            <form onSubmit={handleOtherIncomeSubmit} className="space-y-6">
              {/* 1. INCOME CATEGORY */}
              <div>
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-2.5 flex items-center">
                  <Tag size={14} className="mr-1.5 text-amber-700" />
                  Income Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Fines', 'Hall Booking', 'Service Charges', 'Promotions', 'Other'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setOtherCategory(cat)}
                      className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border ${
                        otherCategory === cat
                          ? 'bg-amber-700 text-white border-amber-800 shadow-md scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. SOURCE INFORMATION */}
              <div className="space-y-4 pt-3 border-t border-amber-200/60 dark:border-slate-800">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider flex items-center">
                  <UserCheck size={14} className="mr-1.5 text-amber-700" />
                  Source Information
                </label>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Select Flat Number (Optional Resident Link)
                  </label>
                  <select
                    value={otherFlatId}
                    onChange={(e) => handleOtherFlatChange(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">-- Manual Payer / Company (No Flat Linked) --</option>
                    {state.flats.map((flat) => (
                      <option key={flat.id} value={flat.id}>
                        {flat.flatNumber} - {flat.ownerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Manual Source (Name / Company / Details)
                  </label>
                  <input
                    type="text"
                    value={manualSourceName}
                    onChange={(e) => setManualSourceName(e.target.value)}
                    placeholder="e.g. Samsung Banner Ads, Airtel, or Guest Name"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* 3. PAYMENT SPECIFICATIONS */}
              <div className="space-y-4 pt-3 border-t border-amber-200/60 dark:border-slate-800">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider flex items-center">
                  <CreditCard size={14} className="mr-1.5 text-amber-700" />
                  Payment Specifications
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Amount Received (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">₹</span>
                      <input
                        required
                        type="number"
                        value={amount || ''}
                        onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : 0)}
                        placeholder="e.g. 5000"
                        className="w-full pl-8 pr-3 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Date of Receipt *
                    </label>
                    <input
                      required
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3.5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Receipt Number (Auto Continuous)
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="bg-yellow-400 text-black font-black px-4 py-3 rounded-xl border border-yellow-500 shadow-sm text-lg">
                        #{previewReceiptNo}
                      </span>
                      <input
                        type="number"
                        value={manualReceiptNo}
                        onChange={(e) => setManualReceiptNo(e.target.value)}
                        placeholder="Manual Override #"
                        className="w-full px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Payment Mode
                    </label>
                    <div className="flex space-x-3 pt-0.5">
                      <label className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border cursor-pointer transition-all ${paymentMode === 'CASH' ? 'bg-amber-100/80 border-amber-400 dark:bg-amber-950/40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <input
                          type="radio"
                          name="otherPaymentMode"
                          value="CASH"
                          checked={paymentMode === 'CASH'}
                          onChange={() => setPaymentMode('CASH')}
                          className="w-4 h-4 text-amber-600"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">CASH</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border cursor-pointer transition-all ${paymentMode === 'BANK' ? 'bg-amber-100/80 border-amber-400 dark:bg-amber-950/40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <input
                          type="radio"
                          name="otherPaymentMode"
                          value="BANK"
                          checked={paymentMode === 'BANK'}
                          onChange={() => setPaymentMode('BANK')}
                          className="w-4 h-4 text-amber-600"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">BANK / UPI</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Remarks / Notes
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Small Hall Booking for birthday party on 25th Aug"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-black py-4 rounded-xl shadow-lg shadow-amber-800/20 active:scale-[0.98] transition-all uppercase tracking-wider text-sm flex items-center justify-center space-x-2"
              >
                <PlusCircle size={18} />
                <span>SUBMIT INCOME ENTRY</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;
