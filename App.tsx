
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
import VendorMaster from './components/VendorMaster';
import { AppState, ViewState, Transaction, FinancialRecord } from './types';
import { loadData, getCloudConfig, syncFromCloud } from './services/storageService';
import { STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [state, setState] = useState<AppState | null>(null);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR'>('IDLE');
  
  // Edit State for Maintenance Transactions
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  
  // State for Finance Module
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [financeRecordToEdit, setFinanceRecordToEdit] = useState<FinancialRecord | null>(null);

  useEffect(() => {
    // Initial Load from Cloud SQL Backend
    const initApp = async () => {
      setSyncStatus('SYNCING');
      try {
        const cloudData = await syncFromCloud();
        if (cloudData) {
          setState(cloudData);
          if (cloudData.theme === 'DARK') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        setSyncStatus('SYNCED');
      } catch (e) {
        console.error("Failed to sync from cloud", e);
        setSyncStatus('ERROR');
      }
    };
    initApp();

    // Listen for cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        initApp();
      }
    };

    const handleSyncStatus = (e: any) => {
      setSyncStatus(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sync-status', handleSyncStatus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sync-status', handleSyncStatus);
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
    <Layout currentView={view} setView={setView} syncStatus={syncStatus}>
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
      
      {view === 'VENDORS' && (
        <VendorMaster 
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
