const fs = require('fs');
let code = fs.readFileSync('utils/helpers.ts', 'utf-8');

const oldFunc = `export const calculateMaintenanceForMonth = (flat: { isRented?: boolean }, year: number, month: number): number => {
  if (year < 2026 || (year === 2026 && month < 4)) {
    return 2000;
  }
  return flat.isRented ? 2800 : 2500;
};`;

const newFunc = `export const calculateMaintenanceForMonth = (flat: { isRented?: boolean }, year: number, month: number): number => {
  if (year === 2025 && month === 11) {
    return 500;
  }
  if (year < 2026 || (year === 2026 && month < 4)) {
    return 2000;
  }
  return flat.isRented ? 2800 : 2500;
};`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('utils/helpers.ts', code);
