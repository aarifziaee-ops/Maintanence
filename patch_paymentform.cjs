const fs = require('fs');
let code = fs.readFileSync('components/PaymentForm.tsx', 'utf-8');

code = code.replace(
  "import { generateWhatsAppLink, amountToWords, formatDate, formatCurrency, getTodayDateString, calculateMaintenanceForMonth, getTransactionsForMonth } from '../utils/helpers';",
  "import { generateWhatsAppLink, amountToWords, formatDate, formatCurrency, getTodayDateString, calculateMaintenanceForMonth, getTransactionsForMonth, getOutstandingBreakdown } from '../utils/helpers';"
);

const newMemo = `
  const outstandingBreakdownForSelected = useMemo(() => {
    if (!selectedFlatId) return [];
    const flat = state.flats.find(f => f.id === selectedFlatId);
    if (!flat) return [];
    const epochYear = 2025;
    const epochMonth = 11;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const pastTransactions = state.transactions.filter(t => t.flatId === flat.id);
    return getOutstandingBreakdown(flat, pastTransactions, epochYear, epochMonth, currentYear, currentMonth);
  }, [selectedFlatId, state.flats, state.transactions]);

  const outstandingMonthsStr = useMemo(() => {
    if (outstandingBreakdownForSelected.length === 0) return '';
    return outstandingBreakdownForSelected.map(b => b.monthName.substring(0, 3).toUpperCase()).join(', ');
  }, [outstandingBreakdownForSelected]);

`;

code = code.replace(
  "const intendedMonth = useMemo(() => {",
  newMemo + "const intendedMonth = useMemo(() => {"
);

const newRender = `
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Period / Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  placeholder="e.g. May-June 2026"
                />
                {outstandingMonthsStr && !editingTx && (
                  <p className="text-[10px] font-bold text-red-500 dark:text-red-400 mt-1.5 ml-1 flex items-center">
                    <AlertCircle size={10} className="mr-1" />
                    Pending: {outstandingMonthsStr}
                  </p>
                )}
              </div>
`;

code = code.replace(
  /<div>\s*<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Period \/ Remarks<\/label>\s*<input\s*type="text"\s*value=\{remarks\}\s*onChange=\{\(e\) => setRemarks\(e\.target\.value\)\}\s*className="w-full px-4 py-3\.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"\s*placeholder="e\.g\. May-June 2026"\s*\/>\s*<\/div>/,
  newRender
);

fs.writeFileSync('components/PaymentForm.tsx', code);
