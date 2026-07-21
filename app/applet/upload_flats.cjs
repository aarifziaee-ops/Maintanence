const fs = require('fs');
const path = require('path');

async function run() {
  const csvPath = path.join('/app/applet', 'flat_master.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').slice(1);
  const flats = lines.filter(line => line.trim()).map(line => {
    const parts = line.split(',');
    return {
      id: parts[0],
      flatNumber: parts[1],
      ownerName: parts[2],
      mobile: parts[3],
      isRented: parts[4] === 'TRUE',
      status: parts[5],
      tenantName: parts[6],
      tenantMobile: parts[7],
      vehicle2WCount: parseInt(parts[8]) || 0,
      vehicle4WCount: parseInt(parts[9]) || 0,
      vehicle2WNumbers: '',
      vehicle4WNumbers: ''
    };
  });

  const stateRes = await fetch('http://localhost:3000/api/state');
  const state = await stateRes.json();
  
  const newState = {
    ...state,
    flats: flats
  };

  const res = await fetch('http://localhost:3000/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newState)
  });
  console.log(await res.text());
}
run();
