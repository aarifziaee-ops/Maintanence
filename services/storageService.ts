import { AppState, FinancialRecord, Vendor, HallBooking, Transaction, PaymentStatus } from '../types';

export const loadData = async (): Promise<AppState> => {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      return data as AppState;
    }
    throw new Error("Failed to load state");
  } catch (err) {
    console.error("Error loading data", err);
    throw err;
  }
};

export const saveData = async (state: AppState) => {
  try {
    const url = (typeof window === 'undefined') ? 'http://localhost:3000/api/save' : '/api/save';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });
    if (!res.ok) {
      throw new Error("Failed to save state");
    }
  } catch (err) {
    console.error("Error saving data", err);
  }
};

export const syncFromCloud = async (): Promise<AppState | null> => {
  return await loadData();
};

export const addFinancialRecord = (state: AppState, record: Omit<FinancialRecord, 'id' | 'timestamp'>) => {
  const newState = { 
    ...state,
    financialRecords: [...state.financialRecords]
  };
  const newRecord: FinancialRecord = {
    ...record,
    id: `fin-${Date.now()}`,
    timestamp: Date.now(),
    type: record.type || 'EXPENSE',
    paymentMode: record.paymentMode || 'CASH'
  };
  newState.financialRecords = [newRecord, ...newState.financialRecords];
  saveData(newState);
  return newState;
};

export const updateFinancialRecord = (state: AppState, id: string, updates: Partial<FinancialRecord>) => {
  const newState = { 
    ...state,
    financialRecords: [...state.financialRecords]
  };
  const index = newState.financialRecords.findIndex(r => r.id === id);
  if (index !== -1) {
    newState.financialRecords[index] = { ...newState.financialRecords[index], ...updates };
    saveData(newState);
  }
  return newState;
};

export const deleteFinancialRecord = (state: AppState, id: string) => {
  const newState = { 
    ...state,
    financialRecords: state.financialRecords.filter(r => r.id !== id)
  };
  saveData(newState);
  return newState;
};

export const clearFinancialRecords = (state: AppState) => {
  const newState = { ...state, financialRecords: [] };
  saveData(newState);
  return newState;
};

export const addVendor = (state: AppState, vendor: Omit<Vendor, 'id' | 'createdAt'>) => {
  const newState = {
    ...state,
    vendors: [...(state.vendors || [])]
  };
  const newVendor: Vendor = {
    ...vendor,
    id: `vendor-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  newState.vendors = [newVendor, ...newState.vendors];
  saveData(newState);
  return newState;
};

export const updateVendor = (state: AppState, id: string, updates: Partial<Vendor>) => {
  const newState = {
    ...state,
    vendors: [...(state.vendors || [])]
  };
  const index = newState.vendors.findIndex(v => v.id === id);
  if (index !== -1) {
    newState.vendors[index] = { ...newState.vendors[index], ...updates };
    saveData(newState);
  }
  return newState;
};

export const deleteVendor = (state: AppState, id: string) => {
  const newState = {
    ...state,
    vendors: (state.vendors || []).filter(v => v.id !== id)
  };
  saveData(newState);
  return newState;
};

export const addHallBooking = (state: AppState, booking: Omit<HallBooking, 'id' | 'timestamp'>) => {
  const newState = {
    ...state,
    hallBookings: [...(state.hallBookings || [])]
  };
  const newBooking: HallBooking = {
    ...booking,
    id: `hall-${Date.now()}`,
    timestamp: Date.now()
  };
  newState.hallBookings = [newBooking, ...newState.hallBookings].sort((a,b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  saveData(newState);
  return newState;
};

export const updateHallBookingDetails = (state: AppState, id: string, updates: Partial<HallBooking>) => {
  const newState = {
    ...state,
    hallBookings: [...(state.hallBookings || [])]
  };
  const index = newState.hallBookings.findIndex(b => b.id === id);
  if (index !== -1) {
    newState.hallBookings[index] = { ...newState.hallBookings[index], ...updates };
    newState.hallBookings.sort((a,b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
    saveData(newState);
  }
  return newState;
};

export const deleteHallBooking = (state: AppState, bookingId: string) => {
  const newState = {
    ...state,
    hallBookings: (state.hallBookings || []).filter(b => b.id !== bookingId)
  };
  saveData(newState);
  return newState;
};

export const setLastReceiptNo = (state: AppState, newLastReceiptNo: number) => {
  const newState = {
    ...state,
    lastReceiptNo: newLastReceiptNo
  };
  saveData(newState);
  return newState;
};

export const getCloudConfig = (): any | null => null;
export const saveCloudConfig = (config: any) => {};
export const updateInsight = (state: AppState, text: string) => { return state; }
export const importFinancialRecordsFromCSV = (state: AppState, csv: string) => { return { newState: state, count: 0, errors: [] } }
export const createSystemSnapshot = (state: AppState) => {}
export const restoreSystemSnapshot = () => null;
export const getSnapshotTimestamp = () => null;

export const processPayment = (
  state: AppState,
  flatId: string,
  ownerName: string,
  mobile: string,
  amount: number,
  paymentDate: string,
  paymentMode: 'CASH' | 'BANK',
  manualReceiptNo?: number,
  remarks?: string
) => {
  const flat = state.flats.find((f) => f.id === flatId || f.flatNumber === flatId);
  const flatNumber = flat ? flat.flatNumber : flatId;
  
  const receiptNo = manualReceiptNo || (state.lastReceiptNo + 1);
  const newLastReceiptNo = Math.max(state.lastReceiptNo, receiptNo);
  
  const transaction = {
    id: `tx-${Date.now()}`,
    receiptNo,
    date: paymentDate,
    timestamp: Date.now(),
    flatId,
    flatNumber,
    ownerName,
    amount,
    mobile,
    paymentMode,
    remarks
  };

  const newState = {
    ...state,
    lastReceiptNo: newLastReceiptNo,
    transactions: [transaction, ...state.transactions]
  };

  return { newState, transaction };
};

export const updateTransaction = (state: AppState, id: string, updates: Partial<Transaction>) => {
  const newState = { ...state, transactions: [...state.transactions] };
  const idx = newState.transactions.findIndex((t: any) => t.id === id);
  if (idx !== -1) {
    newState.transactions[idx] = { ...newState.transactions[idx], ...updates };
    saveData(newState);
  }
  return newState;
};

export const deleteTransaction = (state: AppState, id: string) => {
  const newState = { ...state, transactions: state.transactions.filter((t: any) => t.id !== id) };
  saveData(newState);
  return newState;
};

export const getNextReceiptNoForMonth = (state: AppState, dateString: string): number => {
  return state.lastReceiptNo + 1;
};

export const updateFlatSettings = (state: AppState, flatId: string, updates: any) => {
  const newState = { ...state, flats: [...state.flats] };
  const idx = newState.flats.findIndex((f) => f.id === flatId || f.flatNumber === flatId);
  if (idx !== -1) {
    newState.flats[idx] = { ...newState.flats[idx], ...updates };
    saveData(newState);
  }
  return newState;
};

export const updateFlatStatus = (state: AppState, flatId: string, status: PaymentStatus) => {
  const newState = { ...state, flats: [...state.flats] };
  const idx = newState.flats.findIndex((f) => f.id === flatId || f.flatNumber === flatId);
  if (idx !== -1) {
    newState.flats[idx] = { ...newState.flats[idx], status };
    saveData(newState);
  }
  return newState;
};

export const uploadCurrentDataToCloud = async (state: AppState) => {
  await saveData(state);
  return state;
};

export const updateFlatsFromCSV = async (state: AppState, csv: string) => {
  const lines = csv.split('\n');
  const updatedFlats = [...state.flats];
  let updatedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',');
    
    // id,flatNumber,ownerName,mobile,isRented,status,tenantName,tenantMobile,vehicle2W,vehicle4W
    const [id, flatNumber, ownerName, mobile, isRentedStr, statusStr, tenantName, tenantMobile, vehicle2W, vehicle4W] = values;

    const index = updatedFlats.findIndex(f => f.id === id);
    if (index !== -1) {
      updatedFlats[index] = {
        ...updatedFlats[index],
        flatNumber: flatNumber || updatedFlats[index].flatNumber,
        ownerName: ownerName || updatedFlats[index].ownerName,
        mobile: mobile || updatedFlats[index].mobile,
        isRented: isRentedStr === 'TRUE',
        status: (statusStr as PaymentStatus) || updatedFlats[index].status,
        tenantName: tenantName || updatedFlats[index].tenantName,
        tenantMobile: tenantMobile || updatedFlats[index].tenantMobile,
        vehicle2WCount: parseInt(vehicle2W) || 0,
        vehicle4WCount: parseInt(vehicle4W) || 0
      };
      updatedCount++;
    }
  }
  
  const newState = { ...state, flats: updatedFlats };
  await saveData(newState);
  return { newState, updatedCount };
};
export const exportDataToExcel = (state: AppState) => { };
export const importDataFromExcel = async (file: File): Promise<AppState> => { return { flats: [], transactions: [], financialRecords: [], hallBookings: [], vendors: [], lastReceiptNo: 0 }; };
export const importTransactionsFromCSV = (state: AppState, csv: string) => { return { newState: state, count: 0, errors: [] }; };
export const isCloudEnabled = () => true;


export const updateTheme = (state: AppState, theme: 'LIGHT' | 'DARK') => {
  const newState = { ...state, theme };
  saveData(newState);
  return newState;
};

export const recoverLegacyData = () => { return null; };

export const updateFlatDetails = updateFlatSettings;

export const exportDataAsJSON = (state: AppState) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `chb_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const importDataFromJSON = async (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as AppState;
        
        // Basic validation
        if (!data.flats || !data.transactions) {
          throw new Error("Invalid backup format");
        }
        
        // Save directly to backend
        await saveData(data);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
