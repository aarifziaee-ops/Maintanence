const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

const startIdx = code.indexOf('const renderDirectory = () => {');
const endMarker = '    );\n  };\n';
let endIdx = code.indexOf(endMarker, startIdx);
if (endIdx === -1) {
    console.error("Could not find end marker");
} else {
    endIdx += endMarker.length;
    const renderOwners = `
  const renderDirectory = (type: 'OWNERS' | 'TENANTS') => {
    const isTenants = type === 'TENANTS';
    const title = isTenants ? 'Tenant Directory' : 'Owner Directory';
    const filteredFlats = [...state.flats]
      .filter(f => (isTenants ? f.isRented : !f.isRented))
      .sort((a,b) => a.flatNumber.localeCompare(b.flatNumber));

    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center no-print">
          <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">{filteredFlats.length} Flats</p>
          </div>
          <button onClick={handleDownload} className="flex items-center space-x-2 text-white bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
          </button>
         </div>

         <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">CONTINENTAL HEIGHTS B WING</h1>
              <h2 className="text-lg font-bold text-black uppercase">{title.toUpperCase()}</h2>
         </div>
         
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-black print:rounded-none">
          <div className="flex items-center bg-slate-900 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-white uppercase tracking-widest print:bg-slate-100 print:text-black">
             <div className="w-16 shrink-0">Flat</div>
             <div className="flex-1 min-w-0 px-2">Name</div>
             <div className="w-32 shrink-0">Telephone</div>
             <div className="w-10 shrink-0 text-center no-print"></div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
            {filteredFlats.map(flat => (
              <div key={flat.id} className="flex items-center p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:p-2">
                 <div className="w-16 shrink-0 font-black text-slate-800 dark:text-white print:text-black">{flat.flatNumber}</div>
                 <div className="flex-1 min-w-0 px-2 truncate text-slate-600 dark:text-slate-300 print:text-black font-medium">{flat.ownerName || '-'}</div>
                 <div className="w-32 shrink-0 text-slate-600 dark:text-slate-300 print:text-black font-mono">
                    {flat.mobile || '-'}
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
            {filteredFlats.length === 0 && (
               <div className="p-8 text-center text-slate-500 italic">No flats found in this category.</div>
            )}
          </div>
         </div>
      </div>
    );
  };
`;
    
    code = code.substring(0, startIdx) + renderOwners + code.substring(endIdx);
    fs.writeFileSync('components/Reports.tsx', code);
    console.log("Success");
}
