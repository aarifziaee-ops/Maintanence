import * as fs from 'fs';

const input = fs.readFileSync('new_data.txt', 'utf8');
const lines = input.split('\n');

const header = 'vehicle2WNumbers,tenantMobile,vehicle4WCount,id,status,isRented,ownerName,mobile,tenantName,vehicle4WNumbers,flatNumber,vehicle2WCount';

const csvLines = lines.map(line => {
  const parts = line.split('\t');
  if (parts.length < 12) return null; // Skip malformed lines

  // Map parts (assuming split by tab)
  // [0] vehicle2WNumbers
  // [1] tenantMobile
  // [2] vehicle4WCount
  // [3] id
  // [4] status
  // [5] isRented
  // [6] ownerName
  // [7] mobile
  // [8] tenantName
  // [9] vehicle4WNumbers
  // [10] flatNumber
  // [11] vehicle2WCount

  // Need to clean up whitespace and escape quotes
  const cleaned = parts.map(p => {
    let s = p.trim();
    if (s.includes(',')) s = `"${s}"`;
    return s;
  });

  return cleaned.join(',');
}).filter(l => l !== null);

fs.writeFileSync('flat_master.csv', [header, ...csvLines].join('\n'));
console.log('Successfully created flat_master.csv');
