const fs = require('fs');
const { updateFlatsFromCSV } = require('./services/storageService.js');

async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/state');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const state = await response.json();
        
        const csv = fs.readFileSync('flat_data.csv', 'utf8');
        
        const { updatedCount } = await updateFlatsFromCSV(state, csv);
        console.log(`Successfully updated ${updatedCount} flats`);
    } catch (e) {
        console.error(e);
    }
}

run();
