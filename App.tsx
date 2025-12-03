
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PaymentForm from './components/PaymentForm';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { AppState, ViewState, Transaction } from './types';
import { loadData } from './services/storageService';
import { STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [state, setState] = useState<AppState | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  useEffect(() => {
    // Load data from local storage on mount
    const data = loadData();
    setState(data);

    // Listen for storage events (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newData = loadData();
        setState(newData);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

  if (!state) return <div className="flex h-screen items-center justify-center text-slate-500">Loading...</div>;

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
    </Layout>
  );
};

export default App;
