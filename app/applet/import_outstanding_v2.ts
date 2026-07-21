import fs from 'fs';

function parseMonthHeader(header: string): string {
    const parts = header.trim().split('-');
    if (parts.length !== 2) return header;
    const monthAbbr = parts[0].toLowerCase();
    const shortYear = parts[1];
    
    const MONTHS_MAP: Record<string, string> = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    const monthNum = MONTHS_MAP[monthAbbr];
    if (!monthNum) return header;
    
    const fullYear = `20${shortYear}`;
    return `${fullYear}-${monthNum}`;
}

async function run() {
    try {
        // Load flat number map from flat_data.csv
        const flatCsv = fs.readFileSync('flat_data.csv', 'utf8');
        const flatLines = flatCsv.split('\n');
        const flatMap: Record<string, string> = {}; // flatNumber -> database flatId
        for (let i = 1; i < flatLines.length; i++) {
            const line = flatLines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            const id = parts[0];
            const flatNum = parts[1];
            if (id && flatNum) {
                flatMap[flatNum.trim()] = id.trim();
            }
        }

        // Clear existing outstanding balances
        const clearRes = await fetch('http://127.0.0.1:3000/api/clear-outstanding', { method: 'POST' });
        if (!clearRes.ok) throw new Error(`Failed to clear: ${clearRes.statusText}`);
        
        const csv = fs.readFileSync('app/applet/outstanding_v2.csv', 'utf8');
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        const outstandingData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row) continue;
            
            const values = row.split(',');
            const flatNumber = values[0].trim();
            const flatId = flatMap[flatNumber];
            
            if (!flatId) {
                console.warn(`WARNING: Flat number ${flatNumber} not found in flat_data.csv!`);
                continue;
            }
            
            for (let j = 1; j < headers.length - 1; j++) { // Skip the last column which is TOTAL
                const monthHeader = headers[j];
                const amountStr = values[j];
                
                if (!amountStr || amountStr === '-' || amountStr === '') continue;
                
                const amount = parseFloat(amountStr);
                if (isNaN(amount)) continue;
                
                const formattedMonth = parseMonthHeader(monthHeader);
                
                outstandingData.push({
                    flatId,
                    month: formattedMonth,
                    amount
                });
            }
        }
        
        console.log(`Processed ${outstandingData.length} outstanding records. Sending to API...`);
        
        const res = await fetch('http://127.0.0.1:3000/api/outstanding-balances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balances: outstandingData })
        });
        
        if (!res.ok) {
            throw new Error(`Failed to save: ${res.statusText}`);
        }
        
        console.log(`Successfully saved ${outstandingData.length} records`);
        
    } catch (e) {
        console.error(e);
    }
}

run();
