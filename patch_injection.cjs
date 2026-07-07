const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf-8');

// Remove old injections from loadData
code = code.replace(/         \/\/ Fix any existing B-0902 Jan 2026 txs[\s\S]*?\/\/ Save it back immediately so it persists\s*localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\);\s*\}/g, '');
code = code.replace(/         \/\/ Hardcoded transaction injection for B-0902[\s\S]*?localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\);\s*\}\s*\}/g, '');

const injectFunc = `
const applyInjections = (state: AppState): boolean => {
    let modified = false;

    // Hardcoded transaction injection for B-0902
    const b0902JanTxExists = state.transactions.some((t) => t.flatNumber === 'B-0902' && (t.date.startsWith('2026-01') || (t.remarks && t.remarks.toLowerCase().includes('january'))));
    if (!b0902JanTxExists) {
        const flatId = state.flats.find((f) => f.flatNumber === 'B-0902')?.id;
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
            state.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            modified = true;
        }
    }

    // Fix any existing B-0902 Jan 2026 txs
    state.transactions.forEach(t => {
        if (t.flatNumber === 'B-0902' && (t.date.startsWith('2026-01') || (t.remarks && t.remarks.toLowerCase().includes('january')))) {
            if (t.amount !== 500 || !t.remarks) {
                t.amount = 500;
                if (!t.remarks) t.remarks = 'January 2026';
                modified = true;
            }
        }
    });

    return modified;
};
`;

code = code.replace("export const loadData = (): AppState => {", injectFunc + "\nexport const loadData = (): AppState => {");

// Inject in loadData
code = code.replace(
  "return state;\n      }\n    } catch (e) {",
  "if (applyInjections(state)) {\n            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));\n            if (isCloudEnabled()) saveToCloud(state);\n         }\n         return state;\n      }\n    } catch (e) {"
);

// Inject in syncFromCloud
code = code.replace(
  "localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));\n    return cloudData;",
  "if (applyInjections(cloudData)) {\n        if (isCloudEnabled()) saveToCloud(cloudData);\n    }\n    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));\n    return cloudData;"
);

// Also replace the remaining parts of the old hardcode from loadData if any
code = code.replace(/\/\/ Hardcoded transaction injection for B-0902[\s\S]*?if \(!b0902JanTxExists\) \{[\s\S]*?localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\);\s*\}\s*\}/g, "");
code = code.replace(/\/\/ Fix any existing B-0902 Jan 2026 txs[\s\S]*?if \(updatedB0902\) \{\s*localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\);\s*\}/g, "");


fs.writeFileSync('services/storageService.ts', code);
