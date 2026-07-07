const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

// 1. Add new tabs to JSX
const newTabsJSX = `
             <button onClick={() => setActiveTab('OUTSTANDING')} className={\`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all \${activeTab === 'OUTSTANDING' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}\`}>
                <AlertCircle size={14} className="mr-2 hidden sm:inline" />
                Outstanding
             </button>
             <button onClick={() => setActiveTab('DIRECTORY')} className={\`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all \${activeTab === 'DIRECTORY' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}\`}>
                <Users size={14} className="mr-2 hidden sm:inline" />
                Directory
             </button>
`;
code = code.replace(
  /<button onClick=\{\(\) => setActiveTab\('UNPAID'\)\}/,
  newTabsJSX + "\n             <button onClick={() => setActiveTab('UNPAID')}"
);

// 2. Add render function calls
const newRenders = `
          {activeTab === 'OUTSTANDING' && renderOutstandingReport()}
          {activeTab === 'DIRECTORY' && renderDirectory()}
`;
code = code.replace(
  /\{activeTab === 'DAILY' && renderDailyReport\(\)\}/,
  "{activeTab === 'DAILY' && renderDailyReport()}\n" + newRenders
);

// 3. Define the functions
const newFunctions = `
  const renderOutstandingReport = () => {
    const today = new Date();
    const selYear = today.getFullYear();
    const selMonth = today.getMonth() + 1;
    const epochYear = 2026;
    const epochMonth = 4;
    
    let totalOutstanding = 0;
    
    const outstandingData = state.flats.map(flat => {
      const expectedTotalBefore = calculateExpectedTotalBefore(flat, epochYear, epochMonth, selYear, selMonth + 1);
      
      const totalPaidBefore = state.transactions
        .filter(t => t.flatId === flat.id)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const arrears = expectedTotalBefore - totalPaidBefore;
      
      return {
        ...flat,
        arrears
      };
    }).filter(f => f.arrears > 0).sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
    
    totalOutstanding = outstandingData.reduce((sum, f) => sum + f.arrears, 0);
    
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center no-print">
          <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Consolidated Outstanding</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">All Arrears</p>
          </div>
          <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
          </button>
         </div>

         <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-lg font-bold text-black uppercase">CONSOLIDATED OUTSTANDING</h2>
              <p className="text-sm text-black">As of: {new Date().toLocaleDateString('en-IN')}</p>
         </div>
         
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print mb-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Total Outstanding</span>
            <span className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(totalOutstanding)}</span>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
          <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
             <div className="w-16 shrink-0">Flat</div>
             <div className="flex-1 min-w-0 px-2">Owner</div>
             <div className="w-32 shrink-0 text-right">Outstanding</div>
             <div className="w-10 shrink-0 text-center no-print"></div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
            {outstandingData.map(flat => (
              <div key={flat.id} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2">
                 <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
                 <div className="flex-1 min-w-0 px-2 truncate text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
                 <div className="w-32 shrink-0 text-right font-black text-red-600 dark:text-red-400 print:text-black">
                    {formatCurrency(flat.arrears)}
                 </div>
                 <div className="w-10 shrink-0 flex justify-center no-print">
                     {flat.mobile && (
                       <a 
                          href={generateReminderLink(flat.mobile, flat.ownerName, flat.flatNumber, flat.arrears)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" 
                          title="Send Reminder via WhatsApp"
                       >
                          <MessageCircle size={18} />
                       </a>
                     )}
                 </div>
              </div>
            ))}
            {outstandingData.length === 0 && (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold italic">No outstanding payments found.</div>
            )}
            
            <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                <div className="flex-1 text-right font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 print:text-black">Total Outstanding</div>
                <div className="w-32 text-right font-black text-red-600 dark:text-red-400 print:text-black ml-2">{formatCurrency(totalOutstanding)}</div>
                <div className="w-10 no-print"></div>
            </div>
          </div>
         </div>
      </div>
    );
  };
  
  const renderDirectory = () => {
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center no-print">
          <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Resident Directory</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Owners & Tenants</p>
          </div>
          <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
          </button>
         </div>

         <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-lg font-bold text-black uppercase">RESIDENT DIRECTORY</h2>
         </div>
         
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
          <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
             <div className="w-16 shrink-0">Flat</div>
             <div className="flex-1 min-w-0 px-2">Owner / Resident</div>
             <div className="w-32 shrink-0">Telephone</div>
             <div className="w-24 shrink-0 text-center">Status</div>
             <div className="w-10 shrink-0 text-center no-print"></div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
            {[...state.flats].sort((a,b) => a.flatNumber.localeCompare(b.flatNumber)).map(flat => (
              <div key={flat.id} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2">
                 <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
                 <div className="flex-1 min-w-0 px-2 truncate text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
                 <div className="w-32 shrink-0 text-slate-600 dark:text-slate-300 print:text-black font-mono">
                    {flat.mobile || '-'}
                 </div>
                 <div className="w-24 shrink-0 flex justify-center">
                    <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider print:border print:border-black \${flat.isRented ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}\`}>
                       {flat.isRented ? 'Tenant' : 'Owner'}
                    </span>
                 </div>
                 <div className="w-10 shrink-0 flex justify-center no-print">
                     {flat.mobile && (
                       <a 
                          href={\`https://wa.me/\${flat.mobile}\`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" 
                       >
                          <MessageCircle size={18} />
                       </a>
                     )}
                 </div>
              </div>
            ))}
          </div>
         </div>
      </div>
    );
  };
`;
code = code.replace(
  /const renderBankTransferReport = \(\) => \{/,
  newFunctions + "\nconst renderBankTransferReport = () => {"
);

// Add missing icon import
if (!code.includes("Users")) {
    code = code.replace(
        /import \{ (.*?) \} from 'lucide-react';/,
        "import { $1, Users } from 'lucide-react';"
    );
}

fs.writeFileSync('components/Reports.tsx', code);
