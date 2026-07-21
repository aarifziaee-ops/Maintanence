import fs from 'fs';
import { saveData } from '../../services/storageService.ts';

async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/state');
        const state = await response.json();
        const csv = fs.readFileSync('flat_data.csv', 'utf8');
        
        const lines = csv.split('\n');
        const dataLines = lines.slice(1);
        
        const newFlats = [];
        
        for (const line of dataLines) {
            const row = line.trim();
            if (!row) continue;
            const values = row.split(',');
            
            const flatData = {
                id: values[0].replace('flat-', ''),
                flatNumber: values[1],
                ownerName: values[2],
                mobile: values[3],
                isRented: values[4] === 'TRUE',
                status: values[5] || 'UNPAID',
                tenantName: values[6],
                tenantMobile: values[7],
                vehicle2WCount: parseInt(values[8]) || 0,
                vehicle4WCount: parseInt(values[9]) || 0
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
