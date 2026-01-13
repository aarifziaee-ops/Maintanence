
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PaymentForm from './components/PaymentForm';
import Reports from './components/Reports';
import Settings from './components/Settings';
import FinanceDashboard from './components/FinanceDashboard';
import FinanceForm from './components/FinanceForm';
import FlatMaster from './components/FlatMaster';
import HallBooking from './components/HallBooking';
import { AppState, ViewState, Transaction, FinancialRecord } from './types';
import { loadData } from './services/storageService';
import { STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [state, setState] = useState<AppState | null>(null);
  
  // Edit State for Maintenance Transactions
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  
  // State for Finance Module
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [financeRecordToEdit, setFinanceRecordToEdit] = useState<FinancialRecord | null>(null);

  useEffect(() => {
    // Load data from local storage on mount
    const data = loadData();
    setState(data);

    // Apply theme
    if (data.theme === 'DARK') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for storage events (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newData = loadData();
        setState(newData);
        // Apply theme on storage change too
        if (newData.theme === 'DARK') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update DOM when state theme changes
  useEffect(() => {
    if (state?.theme === 'DARK') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state?.theme]);

  const handleStateUpdate = (newState: AppState) => {
    setState(newState);
  };

  const handleEditFromReport = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setView('PAYMENT');
  };

  const clearEditMode = () => {
    setTransactionToEdit(null);
  };

  const handleEditFinanceRecord = (record: FinancialRecord) => {
    setFinanceRecordToEdit(record);
    setShowFinanceForm(true);
  };

  const closeFinanceForm = () => {
    setShowFinanceForm(false);
    setFinanceRecordToEdit(null);
  };

  if (!state) return <div className="flex h-screen items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">Loading...</div>;

  return (
    <Layout currentView={view} setView={setView}>
      {view === 'DASHBOARD' && <Dashboard state={state} refreshState={handleStateUpdate} />}
      
      {view === 'PAYMENT' && (
        <PaymentForm 
          state={state} 
          refreshState={handleStateUpdate} 
          initialTransactionToEdit={transactionToEdit}
          onClearEdit={clearEditMode}
        />
      )}
      
      {view === 'FLATS' && (
        <FlatMaster 
          state={state} 
          refreshState={handleStateUpdate}
        />
      )}
      
      {view === 'ACCOUNTS' && (
        <FinanceDashboard 
          state={state} 
          refreshState={handleStateUpdate}
          onAddTransaction={() => setShowFinanceForm(true)}
          onEditTransaction={handleEditFinanceRecord}
        />
      )}

      {view === 'HALL_BOOKING' && (
        <HallBooking 
          state={state} 
          refreshState={handleStateUpdate}
        />
      )}
      
      {view === 'REPORTS' && (
        <Reports 
          state={state} 
          view="REPORTS" 
          refreshState={handleStateUpdate} 
          onEditTransaction={handleEditFromReport}
        />
      )}
      
      {view === 'UNPAID_LIST' && <Reports state={state} view="UNPAID_LIST" refreshState={handleStateUpdate} />}
      
      {view === 'SETTINGS' && <Settings state={state} refreshState={handleStateUpdate} />}

      {/* Modal for Finance Transactions */}
      {showFinanceForm && (
        <FinanceForm 
          state={state}
          refreshState={handleStateUpdate}
          onClose={closeFinanceForm}
          recordToEdit={financeRecordToEdit}
        />
      )}

    </Layout>
  );
};

export default App;
