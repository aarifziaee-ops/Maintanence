const fs = require('fs');
const XLSX = require('xlsx');

// Create a dummy workbook
const wb = XLSX.utils.book_new();
const flatsSheet = XLSX.utils.json_to_sheet([{ flatNo: "A-101", ownerName: "Test", contact: "123" }]);
XLSX.utils.book_append_sheet(wb, flatsSheet, "Flats");
XLSX.writeFile(wb, "test.xlsx");

// Now read it the way the app does
const fileBuffer = fs.readFileSync("test.xlsx");
const data = new Uint8Array(fileBuffer);
try {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames.find(sn => sn.toLowerCase() === "flats");
    const sheet = workbook.Sheets[sheetName];
    const flats = XLSX.utils.sheet_to_json(sheet);
    console.log("Flats parsed:", flats);
} catch (e) {
    console.error("Error:", e);
}
