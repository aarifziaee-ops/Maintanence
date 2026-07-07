const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf-8');

const oldInjection = `
         // Hardcoded transaction injection for B-0902
         const hasB0902JanTx = state.transactions.some((t) => t.receiptNo === 212 || (t.flatNumber === 'B-0902' && t.date.startsWith('2026-01') && t.receiptNo === 212));
         if (!hasB0902JanTx) {
            const flatId = state.flats.find((f) => f.flatNumber === 'B-0902')?.id;
            if (flatId) {
                state.transactions.push({
                    receiptNo: 212,
                    date: '2026-01-31',
                    timestamp: new Date('2026-01-31T12:00:00Z').getTime(),
                    flatId: flatId,
                    flatNumber: 'B-0902',
                    ownerName: 'Mahendra krishna Sawant',
                    amount: 2000,
                    mobile: '9326487015',
                    paymentMode: 'CASH',
                    remarks: 'January 2026'
                });
                
                // Keep transactions sorted by date descending just in case
                state.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                // Save it back immediately so it persists
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            }
         }
`;

const newInjection = `
         // Hardcoded transaction injection for B-0902
         const b0902JanTxExists = state.transactions.some((t) => t.flatNumber === 'B-0902' && (t.date.startsWith('2026-01') || (t.remarks && t.remarks.toLowerCase().includes('january'))));
         if (!b0902JanTxExists) {
            const flatId = state.flats.find((f) => f.flatNumber === 'B-0902')?.id;
            // Generate a unique receipt no if 212 is taken
            let rNo = 212;
            while(state.transactions.some(t => t.receiptNo === rNo)) {
                rNo++;
            }
            if (flatId) {
                state.transactions.push({
                    receiptNo: rNo,
                    date: '2026-01-31',
                    timestamp: new Date('2026-01-31T12:00:00Z').getTime(),
                    flatId: flatId,
                    flatNumber: 'B-0902',
                    ownerName: 'Mahendra krishna Sawant',
                    amount: 500, // January amount is 500
                    mobile: '9326487015',
                    paymentMode: 'CASH',
                    remarks: 'January 2026'
                });
                
                // Keep transactions sorted by date descending just in case
                state.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                // Save it back immediately so it persists
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            }
         }
`;

code = code.replace(oldInjection, newInjection);

// Also let's fix the fact that we might have already added a 2000 amount but B-0902 still shows as pending because amount should be 500? No, pending list just checks if a transaction exists. It should disappear.
// But wait! If it already added it as 2000? Let's force update any B-0902 Jan 2026 transaction to 500 and ensure it has "January 2026" as remarks.
const fixInjection = `
         // Fix any existing B-0902 Jan 2026 txs
         let updatedB0902 = false;
         state.transactions.forEach(t => {
            if (t.flatNumber === 'B-0902' && (t.date.startsWith('2026-01') || (t.remarks && t.remarks.toLowerCase().includes('january')))) {
                t.amount = 500;
                if (!t.remarks) t.remarks = 'January 2026';
                updatedB0902 = true;
            }
         });
         if (updatedB0902) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
         }
`;

code = code.replace(
  "// Hardcoded transaction injection for B-0902",
  fixInjection + "\n         // Hardcoded transaction injection for B-0902"
);

fs.writeFileSync('services/storageService.ts', code);
