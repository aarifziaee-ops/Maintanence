import fs from 'fs';

async function run() {
    try {
        const csv = fs.readFileSync('app/applet/outstanding.csv', 'utf8');
        const lines = csv.split('\n');
        const headers = lines[0].split('\t');
        
        const outstandingData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row) continue;
            const values = row.split('\t');
            
            const flatId = values[0];
            
            for (let j = 1; j < values.length - 1; j++) {
                const month = headers[j];
                const amountStr = values[j];
                
                if (amountStr === '-' || amountStr === '') continue;
                
                const amount = parseFloat(amountStr);
                if (isNaN(amount)) continue;
                
                outstandingData.push({
                    flatId,
                    month,
                    amount
                });
            }
        }
        
        console.log(`Processed ${outstandingData.length} outstanding records. Sending to API...`);
        
        const res = await fetch('http://localhost:3000/api/outstanding-balances', {
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
