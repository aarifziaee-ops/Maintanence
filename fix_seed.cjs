const fetch = require('node-fetch');

async function run() {
  const state = {
    flats: [
      { id: '1', flatNumber: '101', ownerName: 'Aarif Ziaee', status: 'PAID' },
      { id: '2', flatNumber: '102', ownerName: 'John Doe', status: 'UNPAID' }
    ],
    transactions: [],
    financialRecords: [],
    hallBookings: [],
    vendors: [],
    lastReceiptNo: 0,
    theme: 'DARK'
  };
  
  const res = await fetch('http://localhost:3000/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
  console.log(await res.text());
}
run();
