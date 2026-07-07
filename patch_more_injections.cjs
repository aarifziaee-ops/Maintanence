const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf-8');

const newInjectFunc = `
const applyInjections = (state: AppState): boolean => {
    let modified = false;

    const injectionsToApply = [
        { flatNumber: 'B-0902', date: '2026-01-31', defaultReceiptNo: 212 },
        { flatNumber: 'B-3206', date: '2026-01-31', defaultReceiptNo: 215 },
        { flatNumber: 'B-1206', date: '2026-01-31', defaultReceiptNo: 213 },
        { flatNumber: 'B-2006', date: '2026-01-31', defaultReceiptNo: 211 },
        { flatNumber: 'B-2408', date: '2026-01-31', defaultReceiptNo: 210 },
        { flatNumber: 'B-3702', date: '2026-01-31', defaultReceiptNo: 209 },
        { flatNumber: 'B-1802', date: '2026-01-27', defaultReceiptNo: 207 },
        { flatNumber: 'B-2301', date: '2026-01-27', defaultReceiptNo: 208 }
    ];

    for (const inj of injectionsToApply) {
        const txExists = state.transactions.some((t) => t.flatNumber === inj.flatNumber && (t.date.startsWith('2026-01') || (t.remarks && t.remarks.toLowerCase().includes('january'))));
        if (!txExists) {
            const flatInfo = state.flats.find((f) => f.flatNumber === inj.flatNumber);
            if (flatInfo) {
                let rNo = inj.defaultReceiptNo;
                while(state.transactions.some(t => t.receiptNo === rNo)) {
                    rNo++;
                }
                state.transactions.push({
                    receiptNo: rNo,
                    date: inj.date,
                    timestamp: new Date(inj.date + 'T12:00:00Z').getTime(),
                    flatId: flatInfo.id,
                    flatNumber: flatInfo.flatNumber,
                    ownerName: flatInfo.ownerName || '',
                    amount: 500, // January amount is 500
                    mobile: flatInfo.mobile || '',
                    paymentMode: 'CASH',
                    remarks: 'January 2026'
                });
                modified = true;
            }
        }

        // Fix any existing Jan 2026 txs for these flats
        state.transactions.forEach(t => {
            if (t.flatNumber === inj.flatNumber && (t.date.startsWith('2026-01') || (t.remarks && t.remarks.toLowerCase().includes('january')))) {
                if (t.amount !== 500 || !t.remarks) {
                    t.amount = 500;
                    if (!t.remarks) t.remarks = 'January 2026';
                    modified = true;
                }
            }
        });
    }

    if (modified) {
        state.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return modified;
};
`;

code = code.replace(/const applyInjections = \(state: AppState\): boolean => \{[\s\S]*?return modified;\n\};/, newInjectFunc.trim());

fs.writeFileSync('services/storageService.ts', code);
