const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

const newRenderUnpaidList = `
  const renderUnpaidList = () => {
    const totalPendingAmountForMonth = unpaidFlats.reduce((sum, flat) => {
        const monthYear = unpaidMonth.split('-');
        return sum + calculateMaintenanceForMonth(flat, parseInt(monthYear[0]), parseInt(monthYear[1]));
    }, 0);

    return (
    <div className="space-y-6">
       <div className="flex justify-between items-center no-print">
        <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pending Payments</h2>
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{unpaidFlats.length}</span>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={copyBroadcastNumbers}
                className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
                title="Copy all numbers for WhatsApp Broadcast"
            >
                {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Numbers'}</span>
            </button>
            <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
                <Download size={14} />
                <span className="hidden sm:inline">Export PDF</span>
            </button>
        </div>
       </div>

       {/* Month Selector for Unpaid */}
       <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between no-print">
            <button onClick={handlePrevMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div className="text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Month</span>
                <span className="font-bold text-slate-800 dark:text-white uppercase">{new Date(unpaidMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
            </div>
            <button onClick={handleNextMonth} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
       </div>

       <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
            <h2 className="text-lg font-bold text-black uppercase">PENDING PAYMENTS</h2>
            <p className="text-sm text-black">Month: {new Date(unpaidMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
       </div>

       <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
        <div className="flex items-center bg-black p-4 border-b border-black text-[10px] font-black text-white uppercase tracking-widest">
           <div className="w-20 shrink-0">Flat</div>
           <div className="flex-1 min-w-0 px-2">Owner</div>
           <div className="w-24 shrink-0 text-right">Amount</div>
           <div className="w-10 shrink-0 text-center no-print"></div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
          {unpaidFlats.map(flat => (
            <div key={flat.id} className="flex items-center p-4 text-xs">
               <div className="w-20 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
               <div className="flex-1 min-w-0 px-2 truncate text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
               <div className="w-24 shrink-0 text-right font-black text-red-600 dark:text-red-400 print:text-black">
                  {formatCurrency(calculateMaintenanceForMonth(flat, parseInt(unpaidMonth.split('-')[0]), parseInt(unpaidMonth.split('-')[1])))}
               </div>
               <div className="w-10 shrink-0 flex justify-center no-print">
                   {flat.mobile && (
                     <a href={generateReminderLink(flat.mobile, flat.ownerName, flat.flatNumber, calculateMaintenanceForMonth(flat, parseInt(unpaidMonth.split('-')[0]), parseInt(unpaidMonth.split('-')[1])))} target="_blank" rel="noreferrer" className="text-green-600 dark:text-green-400 p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Send WhatsApp Reminder">
                        <MessageCircle size={18} />
                     </a>
                   )}
               </div>
            </div>
          ))}

          {unpaidFlats.length > 0 && (
             <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                <div className="flex-1 text-right font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 print:text-black">Total Pending</div>
                <div className="w-24 shrink-0 text-right font-black text-red-600 dark:text-red-400 text-sm print:text-black pl-2">
                   {formatCurrency(totalPendingAmountForMonth)}
                </div>
                <div className="w-10 shrink-0 no-print"></div>
             </div>
          )}

          {unpaidFlats.length === 0 && (
             <div className="p-12 text-center text-slate-400 font-bold italic">Congratulations! No pending payments for {new Date(unpaidMonth + '-01').toLocaleDateString('en-IN', { month: 'long' })}.</div>
          )}
        </div>
       </div>
    </div>
  )};
`;

code = code.replace(
  /const renderUnpaidList = \(\) => \([\s\S]*?<\/[a-zA-Z0-9]+>\s*\)\s*;\s*\n\s*const renderAuditReport =/g,
  newRenderUnpaidList.trim() + "\n\n  const renderAuditReport ="
);

fs.writeFileSync('components/Reports.tsx', code);
