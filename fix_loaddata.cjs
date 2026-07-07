const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf-8');

const correctLoadData = `export const loadData = (): AppState => {
  // Attempt to load cloud config from storage and init
  const cloudConfig = getCloudConfig();
  if (cloudConfig) {
      initFirebase(cloudConfig);
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (saved) {
    try {
      const state = JSON.parse(saved);
      // Basic validation: ensure it's an object with flats
      if (state && Array.isArray(state.flats)) {
         // Migration for new features
         if (!state.transactions) state.transactions = [];
         if (!state.financialRecords) state.financialRecords = [];
         if (!state.hallBookings) state.hallBookings = [];
         if (!state.vendors) state.vendors = [];
         if (!state.theme) state.theme = 'LIGHT'; // Default Theme

         // Fix Receipt Counter - No longer strictly needed for Global, but kept for legacy
         const maxReceipt = state.transactions.reduce((max: number, t: Transaction) => Math.max(max, t.receiptNo), 0);
         if (maxReceipt > state.lastReceiptNo) {
             state.lastReceiptNo = maxReceipt;
         }

         if (applyInjections(state)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            if (isCloudEnabled()) saveToCloud(state);
         }
         return state;
      }
    } catch (e) {
      console.error("Failed to parse saved data", e);
    }
  }

  // First time initialization
  const initialState: AppState = {
    flats: INITIAL_FLAT_DATA.map(f => ({
      id: Math.random().toString(36).substring(2, 9),
      flatNumber: f[0],
      ownerName: f[1],
      mobile: f[2],
      status: PaymentStatus.UNPAID
    })),
    transactions: [],
    financialRecords: [],
    hallBookings: [],
    vendors: [],
    lastReceiptNo: 0,
    theme: 'LIGHT'
  };
  
  applyInjections(initialState);
  saveData(initialState);
  return initialState;
};`;

code = code.replace(/export const loadData = \(\): AppState => \{[\s\S]*?return initialState;\n\};/, correctLoadData);

fs.writeFileSync('services/storageService.ts', code);
