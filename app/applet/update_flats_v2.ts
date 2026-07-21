import fs from 'fs';

async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/state');
        const state = await response.json();
        const csv = fs.readFileSync('flat_master.csv', 'utf8');
        
        const lines = csv.split('\n');
        const dataLines = lines.slice(1);
        
        const newFlats = [];
        
        for (const line of dataLines) {
            const row = line.trim();
            if (!row) continue;
            // Need to handle commas inside quotes, but based on the file, maybe row.split(',') is okay if ownerName isn't comma separated?
            // Actually, ownerName might be in quotes if it has commas.
            // Let's assume a simple CSV parser for now.
            const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            const flatData = {
                id: values[3].replace('flat-', ''),
                flatNumber: values[10],
                ownerName: values[6].replace(/"/g, ''),
                mobile: values[7],
                isRented: values[5] === 'TRUE',
                status: values[4] || 'UNPAID',
                tenantName: values[8],
                tenantMobile: values[1],
                vehicle2WCount: parseInt(values[11]) || 0,
                vehicle4WCount: parseInt(values[2]) || 0
            };
            
            newFlats.push(flatData);
        }
        
        const newState = { ...state, flats: newFlats };
        const res = await fetch('http://localhost:3000/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newState)
        });
        
        if (!res.ok) {
            throw new Error(`Failed to save: ${res.statusText}`);
        }
        
        console.log(`Successfully processed ${newFlats.length} records`);
    } catch (e) {
        console.error(e);
    }
}

run();
