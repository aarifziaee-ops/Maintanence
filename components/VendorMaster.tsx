import React, { useState, useMemo } from 'react';
import { AppState, Vendor, FinancialRecord } from '../types';
import { addVendor, updateVendor, deleteVendor, addFinancialRecord } from '../services/storageService';
import { Users, Plus, Search, Edit2, Trash2, ArrowRight, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, getTodayDateString } from '../utils/helpers';
import VendorLedger from './VendorLedger';

interface VendorMasterProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
}

const VendorMaster: React.FC<VendorMasterProps> = ({ state, refreshState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [category, setCategory] = useState('General');
  const [paymentType, setPaymentType] = useState<'MONTHLY' | 'PER_WORK'>('MONTHLY');
  const [defaultAmount, setDefaultAmount] = useState<number | ''>('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);

  const categories = ['Cleaning', 'Security', 'Plumbing', 'Electrical', 'Accountant', 'Waterman', 'Lift Maintenance', 'General'];

  const resetForm = () => {
    setName('');
    setMobile('');
    setEmail('');
    setContactPerson('');
    setCategory('General');
    setPaymentType('MONTHLY');
    setDefaultAmount('');
    setOpeningBalance(0);
    setEditingVendor(null);
    setShowForm(false);
  };

  const handleEdit = (vendor: Vendor) => {
    setName(vendor.name);
    setMobile(vendor.mobile || '');
    setEmail(vendor.email || '');
    setContactPerson(vendor.contactPerson || '');
    setCategory(vendor.category);
    setPaymentType(vendor.paymentType);
    setDefaultAmount(vendor.defaultAmount || '');
    setOpeningBalance(vendor.openingBalance || 0);
    setEditingVendor(vendor);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const vendorData = {
      name,
      mobile,
      email,
      contactPerson,
      category,
      paymentType,
      defaultAmount: Number(defaultAmount) || 0,
      openingBalance: Number(openingBalance) || 0,
    };

    if (editingVendor) {
      const newState = updateVendor(state, editingVendor.id, vendorData);
      refreshState(newState);
    } else {
      const newState = addVendor(state, vendorData);
      refreshState(newState);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor? This will not delete their financial records.')) {
      const newState = deleteVendor(state, id);
      refreshState(newState);
    }
  };

  // Calculate outstanding balances for all vendors
  const vendorBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    state.vendors.forEach(v => {
      balances[v.id] = v.openingBalance || 0;
    });

    state.financialRecords.forEach(r => {
      if (r.vendorId && balances[r.vendorId] !== undefined) {
        if (r.type === 'VENDOR_BILL') {
          balances[r.vendorId] += r.amount; // Bill increases what we owe
        } else if (r.type === 'EXPENSE') {
          balances[r.vendorId] -= r.amount; // Payment decreases what we owe
        }
      }
    });

    return balances;
  }, [state.vendors, state.financialRecords]);

  // Pending Payments Logic
  const pendingPayments = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const pending: { vendor: Vendor, amount: number, reason: string }[] = [];

    state.vendors.forEach(v => {
      // 1. Check if they have an outstanding balance > 0
      if (vendorBalances[v.id] > 0) {
        pending.push({ vendor: v, amount: vendorBalances[v.id], reason: 'Outstanding Balance' });
        return; // Don't add them twice
      }

      // 2. Check if they are MONTHLY and haven't been billed this month
      if (v.paymentType === 'MONTHLY' && v.defaultAmount > 0) {
        const hasBillThisMonth = state.financialRecords.some(
          r => r.vendorId === v.id && r.type === 'VENDOR_BILL' && r.date.startsWith(currentMonth)
        );
        if (!hasBillThisMonth) {
          pending.push({ vendor: v, amount: v.defaultAmount, reason: 'Pending Monthly Bill Generation' });
        }
      }
    });

    return pending;
  }, [state.vendors, state.financialRecords, vendorBalances]);

  const handleGenerateMonthlyBill = (vendor: Vendor) => {
    if (window.confirm(`Generate monthly bill of ₹${vendor.defaultAmount} for ${vendor.name}?`)) {
      const record: Omit<FinancialRecord, 'id' | 'timestamp'> = {
        type: 'VENDOR_BILL',
        paymentMode: 'CASH', // Default, doesn't really matter for a bill
        amount: vendor.defaultAmount,
        date: getTodayDateString(),
        category: vendor.category,
        description: `Monthly Bill - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        vendorId: vendor.id
      };
      const newState = addFinancialRecord(state, record);
      refreshState(newState);
    }
  };

  const filteredVendors = state.vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedVendor) {
    return (
      <VendorLedger 
        vendor={selectedVendor} 
        state={state} 
        refreshState={refreshState} 
        onBack={() => setSelectedVendor(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Vendors</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Master & Ledgers</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow-md transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-24">
        {/* Pending Payments Dashboard */}
        {pendingPayments.length > 0 && !searchTerm && (
          <div className="mb-6">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
              <AlertCircle size={14} className="mr-1 text-amber-500" />
              Action Required
            </h2>
            <div className="space-y-3">
              {pendingPayments.map((p, idx) => (
                <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{p.vendor.name}</h3>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{p.reason}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-amber-700 dark:text-amber-500">{formatCurrency(p.amount)}</span>
                    {p.reason === 'Pending Monthly Bill Generation' && (
                      <button 
                        onClick={() => handleGenerateMonthlyBill(p.vendor)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                      >
                        Generate
                      </button>
                    )}
                    {p.reason === 'Outstanding Balance' && (
                      <button 
                        onClick={() => setSelectedVendor(p.vendor)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor List */}
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">All Vendors</h2>
        <div className="space-y-3">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p>No vendors found.</p>
            </div>
          ) : (
            filteredVendors.map(vendor => {
              const balance = vendorBalances[vendor.id] || 0;
              return (
                <div key={vendor.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedVendor(vendor)}>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">{vendor.name}</h3>
                      <p className="text-xs text-slate-500">{vendor.category} • {vendor.paymentType === 'MONTHLY' ? 'Monthly' : 'Per Work'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(vendor)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(vendor.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-3 cursor-pointer" onClick={() => setSelectedVendor(vendor)}>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Outstanding Balance</p>
                      <p className={`font-black ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-green-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {balance > 0 ? `${formatCurrency(balance)} Dr` : balance < 0 ? `${formatCurrency(Math.abs(balance))} Cr` : '₹0'}
                      </p>
                    </div>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                      View Ledger <ArrowRight size={14} className="ml-1" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">
                {editingVendor ? 'Edit Vendor' : 'New Vendor'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <form id="vendor-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor Name *</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Type</label>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value as any)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="MONTHLY">Monthly</option>
                      <option value="PER_WORK">Per Work</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                    <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
                    <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {paymentType === 'MONTHLY' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Monthly Amount</label>
                    <input type="number" value={defaultAmount} onChange={e => setDefaultAmount(Number(e.target.value))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Opening Balance (Owed to Vendor)</label>
                  <input type="number" value={openingBalance} onChange={e => setOpeningBalance(Number(e.target.value))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-[10px] text-slate-400 mt-1">Positive = We owe them. Negative = They owe us (Advance).</p>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button type="submit" form="vendor-form" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2">
                <CheckCircle2 size={20} />
                <span>{editingVendor ? 'Update Vendor' : 'Save Vendor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMaster;
