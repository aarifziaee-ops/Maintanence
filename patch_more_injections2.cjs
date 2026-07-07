const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf-8');

const newInjectFunc = `
const applyInjections = (state: AppState): boolean => {
    let modified = false;

    const injectionsToApply = [
        { flatNumber: 'B-0902', date: '2026-01-31', defaultReceiptNo: 212, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-3206', date: '2026-01-31', defaultReceiptNo: 215, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-1206', date: '2026-01-31', defaultReceiptNo: 213, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-2006', date: '2026-01-31', defaultReceiptNo: 211, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-2408', date: '2026-01-31', defaultReceiptNo: 210, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-3702', date: '2026-01-31', defaultReceiptNo: 209, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-1802', date: '2026-01-27', defaultReceiptNo: 207, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-2301', date: '2026-01-27', defaultReceiptNo: 208, targetMonth: '2026-01', remarks: 'January 2026', amount: 500 },
        { flatNumber: 'B-3206', date: '2026-01-31', defaultReceiptNo: 217, targetMonth: '2025-11', remarks: 'November 2025', amount: 500 }
    ];

    for (const inj of injectionsToApply) {
        // Find existing transaction targeting this month
        const txExists = state.transactions.some((t) => 
            t.flatNumber === inj.flatNumber && 
            (t.date.startsWith(inj.targetMonth) || (t.remarks && t.remarks.toLowerCase().includes(inj.remarks.toLowerCase().split(' ')[0])))
        );
        
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
                    amount: inj.amount,
                    mobile: flatInfo.mobile || '',
                    paymentMode: 'CASH',
                    remarks: inj.remarks
                });
                modified = true;
            }
        }

        // Fix any existing txs for these flats targeting this month
        state.transactions.forEach(t => {
            if (t.flatNumber === inj.flatNumber && (t.date.startsWith(inj.targetMonth) || (t.remarks && t.remarks.toLowerCase().includes(inj.remarks.toLowerCase().split(' ')[0])))) {
                if (t.amount !== inj.amount || !t.remarks) {
                    t.amount = inj.amount;
                    if (!t.remarks) t.remarks = inj.remarks;
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
