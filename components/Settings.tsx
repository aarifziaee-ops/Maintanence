
import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { updateFlatsFromCSV, exportDataToExcel, importDataFromExcel, importTransactionsFromCSV } from '../services/storageService';
import { downloadSampleCsv, downloadTransactionSampleCsv } from '../utils/helpers';
import { Upload, Download, FileText, CheckCircle, AlertTriangle, Database, Save, Trash2, Receipt } from 'lucide-react';
import { STORAGE_KEY } from '../constants';

interface SettingsProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
}

const Settings: React.FC<SettingsProps> = ({ state, refreshState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbInputRef = useRef<HTMLInputElement>(null);
  const txFileInputRef = useRef<HTMLInputElement>(null);
  
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  // CSV Bulk Update (Flats)
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const { newState, updatedCount } = updateFlatsFromCSV(state, text);
          refreshState(newState);
          setStatus({
            type: 'success',
            message: `Successfully updated details for ${updatedCount} flats!`
          });
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
           setStatus({
            type: 'error',
            message: 'Failed to process CSV.'
          });
        }
      }
    };
    reader.readAsText(file);
  };

  // CSV Bulk Import (Transactions)
  const handleTxCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const { newState, count, errors } = importTransactionsFromCSV(state, text);
          refreshState(newState);
          
          let msg = `Successfully imported ${count} transactions.`;
          if (errors.length > 0) {
            msg += ` ${errors.length} rows failed. Check console.`;
            console.warn("Import Errors:", errors);
          }
          
          if (count > 0) {
              setStatus({ type: 'success', message: msg });
           } else if (errors.length > 0) {
              setStatus({ type: 'error', message: "Failed to import any transactions. Check file format." });
           } else {
              setStatus({ type: 'idle', message: "" });
           }

          if (txFileInputRef.current) txFileInputRef.current.value = '';
        } catch (error) {
           setStatus({
            type: 'error',
            message: 'Failed to process CSV.'
          });
        }
      }
    };
    reader.readAsText(file);
  };

  // Excel Database Export
  const handleExportDB = () => {
    try {
      exportDataToExcel(state);
      setStatus({ type: 'success', message: 'Database exported to Excel successfully.' });
    } catch (e) {
      setStatus({ type: 'error', message: 'Failed to export database.' });
    }
  };

  // Excel Database Import
  const handleImportDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm("WARNING: This will OVERWRITE all current data with the data from the Excel file. Are you sure?")) {
      if (dbInputRef.current) dbInputRef.current.value = '';
      return;
    }

    try {
      const newState = await importDataFromExcel(file);
      refreshState(newState);
      setStatus({ type: 'success', message: 'Database restored from Excel successfully.' });
    } catch (e) {
      console.error(e);
      // Show the specific error message
      const msg = e instanceof Error ? e.message : 'Unknown error occurred during import.';
      setStatus({ type: 'error', message: msg });
    }
    if (dbInputRef.current) dbInputRef.current.value = '';
  };

  const handleFactoryReset = () => {
    const confirmation = window.prompt("Type 'DELETE' to confirm wiping all data. This cannot be undone.", "");
    if (confirmation === 'DELETE') {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-8 pb-20">
      <h2 className="text-xl font-bold text-slate-800">Settings & Data</h2>

      {/* STATUS MESSAGE */}
      {status.type !== 'idle' && (
        <div className={`p-4 rounded-lg flex items-start animate-fade-in ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle size={20} className="mt-0.5 mr-2 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 mr-2 shrink-0" />}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      {/* SECTION 1: DATABASE MANAGEMENT (EXCEL) */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center">
          <Database size={16} className="mr-2" />
          Database Management (Excel)
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-100">
            <p className="text-sm text-slate-600">
              Use this to backup your entire system or transfer data to another device.
              The Excel file serves as your master database.
            </p>
          </div>
          
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            {/* Export Button */}
            <button 
              onClick={handleExportDB}
              className="p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors active:bg-slate-100"
            >
              <div className="bg-green-100 text-green-600 p-3 rounded-full mb-2">
                <Save size={24} />
              </div>
              <span className="font-bold text-slate-700">Backup DB</span>
              <span className="text-xs text-slate-400 mt-1">Export to .xlsx</span>
            </button>

            {/* Import Button */}
            <div className="relative p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors active:bg-slate-100 cursor-pointer">
              <input
                ref={dbInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportDB}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-2">
                <Upload size={24} />
              </div>
              <span className="font-bold text-slate-700">Restore DB</span>
              <span className="text-xs text-slate-400 mt-1">Import from .xlsx</span>
            </div>
          </div>
        </div>

        {/* Factory Reset */}
         <div className="bg-red-50 rounded-xl border border-red-100 p-4 flex items-center justify-between">
          <div>
            <h4 className="text-red-900 font-bold text-sm">Factory Reset</h4>
            <p className="text-red-700 text-xs mt-1">Delete all data to restore from Excel</p>
          </div>
          <button 
            onClick={handleFactoryReset}
            className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50"
          >
            Clear Data
          </button>
        </div>
      </section>

      {/* SECTION 2: BULK IMPORT TRANSACTIONS (CSV) */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center">
          <Receipt size={16} className="mr-2" />
          Import Transactions (CSV)
        </h3>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Bulk upload historical payments. Flats listed in the CSV will be marked as PAID.
          </p>
          
          <div className="space-y-3">
             <button 
              onClick={downloadTransactionSampleCsv}
              className="flex items-center justify-center space-x-2 w-full py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Download CSV Template</span>
            </button>

            <div className="relative">
              <input
                ref={txFileInputRef}
                type="file"
                accept=".csv"
                onChange={handleTxCsvUpload}
                className="hidden"
                id="tx-csv-upload"
              />
              <label 
                htmlFor="tx-csv-upload"
                className="flex items-center justify-center space-x-2 w-full py-3 bg-blue-600 text-white rounded-xl font-medium cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                <Upload size={18} />
                <span>Upload Transactions</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: BULK UPDATE DETAILS (CSV) */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center">
          <FileText size={16} className="mr-2" />
          Bulk Update Details (CSV)
        </h3>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Update owner names and mobile numbers only. Does not affect payment status.
          </p>
          
          <div className="space-y-3">
             <button 
              onClick={downloadSampleCsv}
              className="flex items-center justify-center space-x-2 w-full py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Download CSV Template</span>
            </button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <label 
                htmlFor="csv-upload"
                className="flex items-center justify-center space-x-2 w-full py-3 bg-slate-800 text-white rounded-xl font-medium cursor-pointer hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
              >
                <Upload size={18} />
                <span>Upload CSV Update</span>
              </label>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Settings;
