
import { AppState, Flat, PaymentStatus, Transaction, FinancialRecord, HallBooking } from '../types';
import { STORAGE_KEY, TOTAL_FLATS, MAINTENANCE_AMOUNT } from '../constants';
import * as XLSX from 'xlsx';
import { saveToCloud, loadFromCloud, initFirebase, isCloudEnabled, FirebaseConfig } from './firebaseService';

const SNAPSHOT_KEY = 'continental_heights_snapshot';

// The full 231 flats list provided by the user
const INITIAL_FLAT_DATA = [
  ["B-0801", "Mangesh Chindarkar", "9769915542"],
  ["B-0802", "Dattaram Babu Birambole", "8102520482"],
  ["B-0803", "Ankita Atul Khochre", "9967719667"],
  ["B-0806", "Rajesh Mahadik", "7045182432"],
  ["B-0807", "Sitaram Bandhu Ambre", "7028280618"],
  ["B-0808", "Sudhir Motiram Kudalkar", "9326595690"],
  ["B-0901", "Vijay Bhujhang Rane", "9969541738"],
  ["B-0902", "Mahendra krishna Sawant", "9326487015"],
  ["B-0903", "Rajendra Ramhari Jaiswal", "9152635981"],
  ["B-0904", "Shobha Raju Wagheela", "9152635981"],
  ["B-0905", "Tushar Gajanan Raut", "9820065408"],
  ["B-0906", "Mohan Jaiswal", "9224472544"],
  ["B-0907", "Bhikaji Shantaram Gaokar", "9082207681"],
  ["B-0908", "Sanjay DadaBhau Nikam", "8080241373"],
  ["B-1001", "Somnath Kaskar( vinaywadi gramastha mandal)", "9769307281"],
  ["B-1002", "Ganpat Sakharam Chavan", "9702427611"],
  ["B-1003", "Santosh Bhalekar(bhalekar gramast mandal)", "9137477849"],
  ["B-1004", "Dayanand Hari Patil", "9930929755"],
  ["B-1005", "Ramchandra Dongre", "7506244379"],
  ["B-1006", "Babaji Rama Rane( devkandgoan gramastha mandal)", "8850577751"],
  ["B-1007", "Vijay Jagannath Gawde", "9969114332"],
  ["B-1008", "Mohan Ganpat Hande", "9969619264"],
  ["B-1101", "Sunil Ghune", "9819110211"],
  ["B-1102", "Manju J. Gupta", "9820694410"],
  ["B-1103", "Shabbir H Oliya", "9664826370"],
  ["B-1104", "Alka Shivram Bangar", "9820084598"],
  ["B-1105", "Suresh B Mane", ""],
  ["B-1106", "Santosh Raghunath Narkar", "9769931871"],
  ["B-1107", "Kishori Rajaram Pange", "9870175483 / 9870163502"],
  ["B-1108", "Prakash Aatmaram Patankar", "9619224490"],
  ["B-1201", "Nooruddin jethajwala", ""],
  ["B-1202", "Shaikh Abizar bhai lakdawala", "9820913967"],
  ["B-1203", "Tasneem Jariwala", "9820934052"],
  ["B-1204", "Fatima sidhpurwala", "9820024967"],
  ["B-1205", "close", ""],
  ["B-1206", "Mamta Mahindra Sawant", "8369885337"],
  ["B-1207", "Kafiya Parveen Shaikh", "9082631571"],
  ["B-1208", "Hatim Mithaiwala", "9967545306"],
  ["B-1301", "Mohammed Ibrahim Sheikh", "9920495281"],
  ["B-1302", "close", ""],
  ["B-1303", "Sharafat Ali Mukri", "9702759778"],
  ["B-1304", "Sharfuddin Khan", "9819125193"],
  ["B-1305", "Arif Liyakat Mukri", "8657722436"],
  ["B-1306", "Rabiya M. Naik", "9222775153"],
  ["B-1307", "Afzal Waghoo (Asif Ali Kondkar)", "9029901470"],
  ["B-1308", "Siraj M Kazi", "9322912100"],
  ["B-1401", "Sajid Liyakat Mukri", "7900046246"],
  ["B-1402", "Jamila Alim Waghoo", "9892323543/ 8850497100"],
  ["B-1403", "Mukhtar Abbas Mungi", "7977844864"],
  ["B-1404", "Mohammed Tole", "9004594996"],
  ["B-1405", "Jamaat ul Muslimeen", "9004594996"],
  ["B-1406", "Aqila Ata Hussain", "7303713622"],
  ["B-1407", "Jamaluddin Wadekar", "8657145382"],
  ["B-1408", "Tahirabi Abdul Razzak Mulla", "9833061236"],
  ["B-1501", "Haneef Kadar Agwan", "8591103362"],
  ["B-1502", "Azizullah Shorat Ali Hajjam", "9820763593"],
  ["B-1503", "Premlata Naresh Shahu", "9869600198"],
  ["B-1506", "Eknath Sangvekar", "8369886830"],
  ["B-1507", "Hayatbi Usman Jaitapkar", "9892877223"],
  ["B-1508", "Gulam Ali Khan", ""],
  ["B-1601", "Abida Imtiyaz Kazi", "9004174320"],
  ["B-1602", "Abdul Razak Malim", "9223511661"],
  ["B-1603", "Israr Ahmed Khan", "9969462736"],
  ["B-1604", "Imran Agwan", "9967000050"],
  ["B-1605", "Abdul Wahab Shaikh", "9870835616"],
  ["B-1606", "Khurshid Ahmed Shaikh", "9821106721"],
  ["B-1607", "Mohammad Akram Abdul Hai Bastavi", "9819271749"],
  ["B-1608", "Abdul Qadir Shaikh", "9869079616"],
  ["B-1701", "Rashida Yusuf Hajju", "9224324032"],
  ["B-1702", "Liyakat Ali Mohammed Khan", "8108211712"],
  ["B-1703", "Munira Karim Waghoo", "9653129200"],
  ["B-1704", "Haneef Kadar Agwan", "9987570045"],
  ["B-1705", "Munira Karim Waghoo", "9653129200"],
  ["B-1706", "Hamida Khan", "9920848443"],
  ["B-1707", "Imran Siddique", ""],
  ["B-1708", "Sajid Karim Thakur", "9820583478"],
  ["B-1801", "Ebrahim Abbas Yahoo", "9699655674"],
  ["B-1802", "Nafis Ahmed Khan", "9321985350"],
  ["B-1803", "Rabiya Khatoon Nisar Ahmed Qureshi", "9773728523"],
  ["B-1804", "Abdul Razzak Khan", "8108786173"],
  ["B-1805", "Mushtaq noor Mohammed Shaikh", "9821444043"],
  ["B-1806", "Abdul Suleman Agwan", "8369529658"],
  ["B-1807", "Aslam Balbale", "9892992907"],
  ["B-1808", "Imran Nazir Mapari", "8082433491"],
  ["B-1901", "Mohammed Haneef Sayyed", "8979529554"],
  ["B-1902", "Imtiyaz Malim", "9769223582"],
  ["B-1903", "Nadim Ali Mira", "9372676416"],
  ["B-1904", "Ejaz Abdul Razzak Malim", "9022343603"],
  ["B-1905", "Fatima Kutubuddin Bakkar", "8650241022"],
  ["B-1906", "Saeed Khalique Mimli", "9820773577"],
  ["B-1907", "Jahida Mohidin Malim", "9987651839"],
  ["B-1908", "Naseema Abdus Sattar Nakhwa", "8422968805"],
  ["B-2001", "Mohammed Khalid Sayyed", "9920347006"],
  ["B-2002", "Razia Shoukat Malim/ Shoukat Adam Malim", "9222062959 / 9869278885"],
  ["B-2003", "Zameer Ahmed Siddiqui", "8655111093"],
  ["B-2004", "close", ""],
  ["B-2005", "Farah Mohammed Thakur", "9323825179"],
  ["B-2006", "Arifa Anwar Kazi / Asif Shaikh Ali", "9967822407/ 7710964862"],
  ["B-2007", "Ismail Abbas Mukri", "9082189919"],
  ["B-2008", "A Rehman A Monye", "9224653656"],
  ["B-2101", "Gulshan Rafique Ahmed Kazi", "7400145402"],
  ["B-2102", "Farzana Mehmood Shaikh", "9769950256"],
  ["B-2103", "Altaf Adil Choudhary", "9824246911"],
  ["B-2104", "Mohammed Shafi Nagori", "9224611923"],
  ["B-2105", "Mohd faizuddin mohd iliyasuddin", "7336007848"],
  ["B-2106", "Salim Abdul Razzak Sayyed", "9004574051"],
  ["B-2107", "Hafiz Mohammed Khan", "9137124123"],
  ["B-2108", "Moinuddin Ali Darvan", "8657624040"],
  ["B-2301", "Shabana M Jagirdaar", "9702244757"],
  ["B-2302", "Farooq Ahmed", ""],
  ["B-2303", "Shatish shanbag", "7019510468"],
  ["B-2306", "Annapurna Pandey", "9820488951"],
  ["B-2307", "close", ""],
  ["B-2308", "Hamza Saifuddin Poonawala", "9619076547"],
  ["B-2401", "Kaleemulla Usman Kasu", "9702162234"],
  ["B-2402", "Fahim Kasam Ibrahim Balbale", "9867786191"],
  ["B-2403", "Raees Boblai", "9820773577"],
  ["B-2404", "Raees Boblai", "9820773577"],
  ["B-2405", "Shaukat Mukri", "8286320711"],
  ["B-2406", "Faizan Abdur Rehman Bargir", "8082368967"],
  ["B-2407", "Fatimabi Abdul Hamid Waghoo", "9619048121"],
  ["B-2408", "Haseena H Lambe", "9930462106"],
  ["B-2501", "Majeebullah haji Chaudhary", "8433897892"],
  ["B-2502", "Majeebullah haji Chaudhary", "8433897892"],
  ["B-2503", "Ashraf Ibrahim Karvinkar", "9820961623"],
  ["B-2504", "Abdul Gani Husain Attar", "9892177505"],
  ["B-2505", "Firoz A Udaipurwala", "9892245097"],
  ["B-2506", "Rehana Shamsuddin shaikh", "9892245097"],
  ["B-2507", "Shabbir Abbas Bhai Sapatwala", "9869905700"],
  ["B-2508", "close", ""],
  ["B-2601", "Salim Abbas Kazi", "7045760207"],
  ["B-2602", "Salim Abbas Kazi", "7045760207"],
  ["B-2603", "Ejaz Mohammed Khan", "9867386747"],
  ["B-2604", "Imran Siddique", ""],
  ["B-2605", "Aziz Shaikh [Musab]", "9773581986"],
  ["B-2606", "Rizwan Rakhangi", "971505467623 [UAE]"],
  ["B-2607", "Zaibunnissa Rakhangi", "971505467623 [UAE]"],
  ["B-2608", "juned Rakhangi", "9594364051"],
  ["B-2701", "Imran Girkar", "8898388928"],
  ["B-2702", "Imran Girkar", "8898388928"],
  ["B-2703", "Anwar Girkar", "9029498165"],
  ["B-2704", "Shama Sharfuddin Mukri", "9773868668"],
  ["B-2705", "Nizamuddin Khan", "9029176349"],
  ["B-2706", "Dilshad Nisar Mukri", "9029042758"],
  ["B-2707", "Kafiya Parven Shaikh", "7977578498"],
  ["B-2708", "Mohsin M Mukri", "9773580859"],
  ["B-2801", "Umrethwala Mansoor Ebrahim", "9969667518"],
  ["B-2802", "Raziya Bashir Khan", "8369804892"],
  ["B-2803", "Riyaz Abdus Sattar kazi", "8286682016"],
  ["B-2804", "Haseena Barmare", "8286954620"],
  ["B-2805", "Afroz Ashfaq Sayyed", "8355862219"],
  ["B-2806", "banu Ibrahim khan (Court Case)(close)", ""],
  ["B-2807", "inayat kazi", "9833210072 / 9222071973"],
  ["B-2808", "Farida Rashid Agha", "9773157792"],
  ["B-2901", "Fahmida A khan", "9372887837"],
  ["B-2902", "Haneef Kadar Agwan", "9987570045"],
  ["B-2903", "Sadiq Ratansi (close)", ""],
  ["B-2904", "Shabina Altaf Vasta", "9224678109"],
  ["B-2905", "Madrasa Talimul Quraan", "9821384777"],
  ["B-2906", "mohammed Tole", "9004594996"],
  ["B-2907", "jamat ul muslimeen", "9004594996"],
  ["B-2908", "Mohammed Hussain Jumma", "7900129259"],
  ["B-3001", "Abdul Rauf Mohammed Khan", "9136770087"],
  ["B-3002", "jamat ul muslimeen", "9221768090"],
  ["B-3003", "Jayvanti S Gala", "9833585758"],
  ["B-3006", "Sushil S Gala", "9322956954"],
  ["B-3007", "Noor Mohammed Khan", "8879151312"],
  ["B-3008", "Ebrahim Abbas Yahoo", "9699655674"],
  ["B-3101", "Shaikh Abizar bhai Lakdawala", "9820913967"],
  ["B-3102", "Kaiser Merchant (Advocate)", "9820039058"],
  ["B-3103", "Sabera Jam", ""],
  ["B-3104", "Sabera Jam", ""],
  ["B-3105", "Usman shaikh", "9137224620"],
  ["B-3106", "fareeda kasam khan", "9969337306"],
  ["B-3107", "Rizwan Khan", "8291300628"],
  ["B-3108", "isha khan", "9930193760"],
  ["B-3201", "Aliasgar zohair Husaini", "9833127610"],
  ["B-3202", "Anees Cyclewala", ""],
  ["B-3203", "Samina Safri", "9867633044"],
  ["B-3204", "sunehwala", "9970592019"],
  ["B-3205", "Murtaza Dahodwala", ""],
  ["B-3206", "Shabbir Dohadwala", "9820773577"],
  ["B-3207", "Malik (Close)", "9930352152"],
  ["B-3208", "Zuzer Zoheb Ghadiali", "9930762152"],
  ["B-3301", "Shabbir Huseini OfficeWala", "9773355252"],
  ["B-3302", "Yunus Shabbir Officewala", "8097355152"],
  ["B-3303", "Samina Sutterwala", ""],
  ["B-3304", "Samina Sutterwala", ""],
  ["B-3305", "Nisreen Kapasi", ""],
  ["B-3306", "Dr.Fatema Jetpurwala", ""],
  ["B-3307", "Akbar Obri", ""],
  ["B-3308", "Saleh Galiwala", "9619984414"],
  ["B-3401", "Dhanaliwala", "9021096237"],
  ["B-3402", "Mohammed Hirani", "9819991316"],
  ["B-3403", "T. Jaorawala", "9820209292"],
  ["B-3404", "Jaorawala", "9820209292"],
  ["B-3405", "Mansoor Habib", "9324532919"],
  ["B-3406", "Mansoor Habib", "9324532919"],
  ["B-3407", "Iqbal Mankada", "9082747532"],
  ["B-3408", "Neemuchwala", ""],
  ["B-3501", "Abdullah Amravatiwala", ""],
  ["B-3502", "Abde Mustansir Rampurwala", "9518558418"],
  ["B-3503", "zainab Painter", ""],
  ["B-3504", "Taher Indorewala", "8080565770"],
  ["B-3505", "Devasli", "9223213072"],
  ["B-3506", "Devasli", "9223213072"],
  ["B-3507", "Yusuf Gallam", ""],
  ["B-3508", "A Ghadiyali", "9322279984"],
  ["B-3601", "Salman Bharmal", ""],
  ["B-3602", "Murtaza Lokhandwala", ""],
  ["B-3603", "Saifudeen Bhanpurawala", "9892835286"],
  ["B-3604", "khozema Aggarwala", "9969619246"],
  ["B-3605", "Samina Husain", "8082259583"],
  ["B-3606", "Fatema Merchant", "9082987619"],
  ["B-3607", "Shabbir Ladhi", "9870499732"],
  ["B-3608", "Rashida Shabbir Ladhi", "9870499732"],
  ["B-3701", "Kathawala", ""],
  ["B-3702", "Zainab Dhankot", ""],
  ["B-3703", "Rashid Patanwala", "9821674372"],
  ["B-3705", "Builders unsold flats (close)", ""],
  ["B-3706", "Builders unsold flats (close)", ""],
  ["B-3707", "Mehjabeen Randhanpurwala", "9967549428"],
  ["B-3708", "Hussain Udaipurwala", ""],
  ["B-3801", "Poonawala", ""],
  ["B-3802", "Yusuf Bhai Rangwala", "9820169705"],
  ["B-3803", "Sakina Aftab", "7387573813"],
  ["B-3804", "Sakina Aftab", ""],
  ["B-3805", "Builders unsold flats (close)", ""],
  ["B-3806", "Builders unsold flats (close)", ""],
  ["B-3807", "Abdul Tayyab Misri", ""],
  ["B-3808", "Aziz Ratlamwala", ""]
];

/**
 * Loads the application state from local storage.
 */
export const loadData = (): AppState => {
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
         if (!state.hallBookings) state.hallBookings = [];
         if (!state.vendors) state.vendors = [];
         if (!state.theme) state.theme = 'LIGHT'; // Default Theme
         
         // Fix Receipt Counter - No longer strictly needed for Global, but kept for legacy
         const maxReceipt = state.transactions.reduce((max: number, t: Transaction) => Math.max(max, t.receiptNo), 0);
         if (maxReceipt > state.lastReceiptNo) {
             state.lastReceiptNo = maxReceipt;
         }

         return state;
      }
    } catch (e) {
      console.error("Failed to parse saved data", e);
    }
  }

  // Initial State if no valid saved data exists
  const flats: Flat[] = INITIAL_FLAT_DATA.map(([flatNumber, ownerName, mobile], index) => ({
    id: `flat-${index}`,
    flatNumber,
    ownerName: ownerName || '',
    mobile: mobile || '',
    status: PaymentStatus.UNPAID, // Everything starts UNPAID
    isRented: false,
    tenantName: '',
    tenantMobile: '',
    vehicle2WCount: 0,
    vehicle4WCount: 0,
    vehicle2WNumbers: '',
    vehicle4WNumbers: ''
  }));

  const state: AppState = {
    flats,
    transactions: [],
    financialRecords: [],
    hallBookings: [],
    vendors: [],
    lastReceiptNo: 0,
    theme: 'LIGHT' // Default
  };
  
  saveData(state);
  return state;
};

/**
 * Saves the application state to local storage and syncs with cloud if enabled.
 */
export const saveData = (state: AppState) => {
  try {
    state.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Automatic Cloud Sync Logic
    if (isCloudEnabled()) {
      window.dispatchEvent(new CustomEvent('sync-status', { detail: 'SYNCING' }));
      saveToCloud(state).then(success => {
        if (!success) {
          console.warn("Background cloud upload failed.");
          window.dispatchEvent(new CustomEvent('sync-status', { detail: 'ERROR' }));
        } else {
          window.dispatchEvent(new CustomEvent('sync-status', { detail: 'SYNCED' }));
        }
      });
    } else {
        const config = getCloudConfig();
        if (config && initFirebase(config)) {
             window.dispatchEvent(new CustomEvent('sync-status', { detail: 'SYNCING' }));
             saveToCloud(state).then(success => {
               if (!success) {
                 window.dispatchEvent(new CustomEvent('sync-status', { detail: 'ERROR' }));
               } else {
                 window.dispatchEvent(new CustomEvent('sync-status', { detail: 'SYNCED' }));
               }
             });
        }
    }
  } catch (e) {
    console.error("Failed to save data to localStorage", e);
  }
};

export const updateTheme = (state: AppState, theme: 'LIGHT' | 'DARK') => {
    const newState = { ...state, theme };
    saveData(newState);
    return newState;
};

export const uploadCurrentDataToCloud = async (state: AppState): Promise<boolean> => {
  return await saveToCloud(state);
};

/**
 * Updates full details for a specific flat (Master Module)
 */
export const updateFlatDetails = (state: AppState, flatId: string, updates: Partial<Flat>) => {
  const newState = { 
    ...state,
    flats: [...state.flats] 
  };
  
  const flatIndex = newState.flats.findIndex(f => f.id === flatId);
  if (flatIndex === -1) throw new Error("Flat not found");

  newState.flats[flatIndex] = {
    ...newState.flats[flatIndex],
    ...updates
  };

  saveData(newState);
  return newState;
};

/**
 * Helper to get next receipt number for a specific month
 * Starting March 2026, receipt numbers continue from the previous month.
 */
export const getNextReceiptNoForMonth = (state: AppState, dateString: string): number => {
    // Continuous numbering system across all months starting from 2026.
    // This allows backdating receipts (e.g., for Jan or Feb) while keeping 
    // the receipt numbers sequential from the last issued one (e.g., 200 -> 201).
    const relevantTx = state.transactions.filter(t => t.date >= '2026-01-01');
    const maxReceipt = relevantTx.reduce((max, t) => Math.max(max, t.receiptNo), 0);
    
    // If no transactions exist in 2026 yet, start from 1.
    // Otherwise, continue from the maximum found (e.g., 200 + 1 = 201).
    return maxReceipt + 1;
};

/**
 * Processes a maintenance payment for a flat.
 * Receipt Numbers reset every month before March 2026, then continue globally.
 */
export const processPayment = (state: AppState, flatId: string, ownerName: string, mobile: string, amount: number, date: string, paymentMode: 'CASH' | 'BANK' = 'CASH') => {
  const newState = { 
    ...state,
    flats: [...state.flats],
    transactions: [...state.transactions]
  };
  
  const flatIndex = newState.flats.findIndex(f => f.id === flatId);
  if (flatIndex === -1) throw new Error("Flat not found");

  // Calculate receipt number based on the month
  const receiptNo = getNextReceiptNoForMonth(state, date);

  const transaction: Transaction = {
    receiptNo,
    date,
    timestamp: Date.now(),
    flatId,
    flatNumber: newState.flats[flatIndex].flatNumber,
    ownerName,
    amount,
    mobile,
    paymentMode
  };

  // Update flat details if changed
  newState.flats[flatIndex] = {
    ...newState.flats[flatIndex],
    status: PaymentStatus.PAID,
    ownerName,
    mobile
  };

  newState.transactions = [transaction, ...newState.transactions];
  
  // Update global counter just in case, though it's less relevant now
  if (receiptNo > newState.lastReceiptNo) {
      newState.lastReceiptNo = receiptNo;
  }

  saveData(newState);
  return { newState, transaction };
};

/**
 * Updates an existing maintenance transaction.
 */
export const updateTransaction = (state: AppState, receiptNo: number, updates: Partial<Transaction>) => {
  const newState = { 
    ...state,
    flats: [...state.flats],
    transactions: [...state.transactions]
  };
  
  const txIndex = newState.transactions.findIndex(t => t.receiptNo === receiptNo && (updates.date ? t.date.substring(0,7) === updates.date.substring(0,7) : true));
  const indexToUse = txIndex !== -1 ? txIndex : newState.transactions.findIndex(t => t.receiptNo === receiptNo);
  
  if (indexToUse === -1) throw new Error("Transaction not found");

  const oldTx = newState.transactions[indexToUse];
  const updatedTx = { ...oldTx, ...updates };
  newState.transactions[indexToUse] = updatedTx;

  // Sync owner name/mobile back to flat master
  const flatIndex = newState.flats.findIndex(f => f.id === updatedTx.flatId);
  if (flatIndex !== -1) {
    newState.flats[flatIndex] = {
      ...newState.flats[flatIndex],
      ownerName: updatedTx.ownerName,
      mobile: updatedTx.mobile,
      status: PaymentStatus.PAID
    };
  }

  saveData(newState);
  return newState;
};

/**
 * Deletes a maintenance transaction.
 */
export const deleteTransaction = (state: AppState, receiptNo: number, dateContext?: string) => {
  const newState = { 
    ...state,
    flats: [...state.flats],
    transactions: [...state.transactions]
  };
  
  const index = newState.transactions.findIndex(t => 
      t.receiptNo === receiptNo && 
      (dateContext ? t.date === dateContext : true)
  );

  if (index === -1) throw new Error("Transaction not found");

  const tx = newState.transactions[index];
  newState.transactions.splice(index, 1);

  const flatIndex = newState.flats.findIndex(f => f.id === tx.flatId);
  if (flatIndex !== -1) {
    newState.flats[flatIndex] = {
      ...newState.flats[flatIndex],
      status: PaymentStatus.UNPAID
    };
  }

  saveData(newState);
  return newState;
};

export const clearAllTransactions = (state: AppState) => {
  const newState = {
    ...state,
    transactions: [],
    flats: state.flats.map(f => ({ ...f, status: PaymentStatus.UNPAID })),
    lastReceiptNo: 0 
  };
  saveData(newState);
  return newState;
};

export const updateFlatsFromCSV = (state: AppState, csvText: string) => {
  const newState = { 
    ...state,
    flats: [...state.flats]
  };
  
  const lines = csvText.split('\n');
  let updatedCount = 0;

  lines.forEach((line, index) => {
    if (index === 0) return;
    const [flatNumber, ownerName, mobile] = line.split(',').map(s => s?.trim());
    if (!flatNumber) return;

    const flatIndex = newState.flats.findIndex(f => f.flatNumber === flatNumber);
    if (flatIndex !== -1) {
      newState.flats[flatIndex] = {
        ...newState.flats[flatIndex],
        ownerName: ownerName || newState.flats[flatIndex].ownerName,
        mobile: mobile || newState.flats[flatIndex].mobile,
      };
      updatedCount++;
    }
  });

  saveData(newState);
  return { newState, updatedCount };
};

export const importTransactionsFromCSV = (state: AppState, csvText: string) => {
  const newState = { 
    ...state,
    flats: [...state.flats],
    transactions: [...state.transactions]
  };
  
  const lines = csvText.split('\n');
  let count = 0;
  const errors: string[] = [];

  lines.forEach((line, index) => {
    if (index === 0) return;
    const parts = line.split(',').map(s => s?.trim());
    const [date, flatNumber, amountStr, receiptNoStr, ownerName] = parts;
    if (!flatNumber || !amountStr) return;

    const amount = parseFloat(amountStr);
    const flat = newState.flats.find(f => f.flatNumber === flatNumber);
    const txDate = date || new Date().toISOString().split('T')[0];

    if (flat) {
      const receiptNo = receiptNoStr ? parseInt(receiptNoStr) : getNextReceiptNoForMonth(newState, txDate);

      const transaction: Transaction = {
        receiptNo,
        date: txDate,
        timestamp: Date.now(),
        flatId: flat.id,
        flatNumber,
        ownerName: ownerName || flat.ownerName,
        amount,
        mobile: flat.mobile || ''
      };

      newState.transactions = [transaction, ...newState.transactions];
      
      const flatIndex = newState.flats.findIndex(f => f.id === flat.id);
      newState.flats[flatIndex] = {
         ...newState.flats[flatIndex],
         status: PaymentStatus.PAID
      };
      count++;
    } else {
      errors.push(`Flat ${flatNumber} not found at line ${index + 1}`);
    }
  });

  saveData(newState);
  return { newState, count, errors };
};

export const exportDataToExcel = (state: AppState) => {
  const wb = XLSX.utils.book_new();

  const flatsSheet = XLSX.utils.json_to_sheet(state.flats);
  XLSX.utils.book_append_sheet(wb, flatsSheet, "Flats");

  const txSheet = XLSX.utils.json_to_sheet(state.transactions);
  XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");

  const financeSheet = XLSX.utils.json_to_sheet(state.financialRecords);
  XLSX.utils.book_append_sheet(wb, financeSheet, "FinancialRecords");
  
  const hallSheet = XLSX.utils.json_to_sheet(state.hallBookings || []);
  XLSX.utils.book_append_sheet(wb, hallSheet, "HallBookings");

  XLSX.writeFile(wb, `CH_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const importDataFromExcel = async (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const flats = XLSX.utils.sheet_to_json(workbook.Sheets["Flats"]) as Flat[];
        const transactions = XLSX.utils.sheet_to_json(workbook.Sheets["Transactions"]) as Transaction[];
        const financialRecords = XLSX.utils.sheet_to_json(workbook.Sheets["FinancialRecords"]) as FinancialRecord[];
        const hallBookings = workbook.Sheets["HallBookings"] ? XLSX.utils.sheet_to_json(workbook.Sheets["HallBookings"]) as HallBooking[] : [];

        if (!flats || flats.length === 0) throw new Error("Invalid format: No flats found");

        const lastReceiptNo = transactions.reduce((max, t) => Math.max(max, t.receiptNo), 0);

        const newState: AppState = {
          flats,
          transactions,
          financialRecords: financialRecords || [],
          hallBookings: hallBookings || [],
          lastReceiptNo,
          theme: 'LIGHT' 
        };
        saveData(newState);
        resolve(newState);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const createSystemSnapshot = (state: AppState) => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
    state,
    timestamp: Date.now()
  }));
};

export const restoreSystemSnapshot = (): AppState | null => {
  const saved = localStorage.getItem(SNAPSHOT_KEY);
  if (!saved) return null;
  const { state } = JSON.parse(saved);
  saveData(state);
  return state;
};

export const getSnapshotTimestamp = (): number | null => {
  const saved = localStorage.getItem(SNAPSHOT_KEY);
  if (!saved) return null;
  const { timestamp } = JSON.parse(saved);
  return timestamp;
};

export const saveCloudConfig = (config: FirebaseConfig) => {
  localStorage.setItem('firebase_config', JSON.stringify(config));
  initFirebase(config);
};

export const getCloudConfig = (): FirebaseConfig | null => {
  const saved = localStorage.getItem('firebase_config');
  return saved ? JSON.parse(saved) : null;
};

export const syncFromCloud = async (): Promise<AppState | null> => {
  const cloudData = await loadFromCloud();
  if (cloudData) {
    const localDataRaw = localStorage.getItem(STORAGE_KEY);
    if (localDataRaw) {
      const localData = JSON.parse(localDataRaw) as AppState;
      
      const cloudUpdated = cloudData.lastUpdated || 0;
      const localUpdated = localData.lastUpdated || 0;

      const cloudTotalItems = (cloudData.transactions?.length || 0) + (cloudData.financialRecords?.length || 0);
      const localTotalItems = (localData.transactions?.length || 0) + (localData.financialRecords?.length || 0);

      // If local is explicitly newer, skip cloud overwrite
      if (localUpdated > cloudUpdated) {
         console.log("Local data is newer based on timestamp, skipping cloud overwrite, uploading instead.");
         saveToCloud(localData); // Background sync to cloud
         return localData; 
      }
      
      // If timestamps are missing or equal, compare item counts as a heuristic fallback
      if (localUpdated >= cloudUpdated && localTotalItems >= cloudTotalItems) {
         console.log("Local data has equal or more records, skipping cloud overwrite");
         // Only upload if it strictly has more items, otherwise it might just be the same data
         if (localTotalItems > cloudTotalItems) {
             saveToCloud(localData);
         }
         return localData;
      }
    }

    // Overwrite local data since cloud is newer or local didn't exist
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
    return cloudData;
  }
  return null;
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

export const importFinancialRecordsFromCSV = (state: AppState, csvText: string) => {
  const newState = { 
    ...state,
    financialRecords: [...state.financialRecords]
  };
  
  const lines = csvText.split('\n');
  let count = 0;
  const errors: string[] = [];

  lines.forEach((line, index) => {
    if (index === 0) return;
    const parts = line.split(',').map(s => s?.trim());
    const [date, type, amountStr, category, description, mode] = parts;
    if (!type || !amountStr) return;

    const amount = parseFloat(amountStr);
    if (!isNaN(amount)) {
      const record: FinancialRecord = {
        id: `fin-${Date.now()}-${count}`,
        type: (type.toUpperCase() as any), 
        amount,
        date: date || new Date().toISOString().split('T')[0],
        category: category || 'General',
        description: description || '',
        paymentMode: (mode?.toUpperCase() === 'BANK') ? 'BANK' : 'CASH',
        timestamp: Date.now()
      };
      newState.financialRecords = [record, ...newState.financialRecords];
      count++;
    } else {
      errors.push(`Invalid amount at line ${index + 1}`);
    }
  });

  saveData(newState);
  return { newState, count, errors };
};

export const updateInsight = (state: AppState, text: string) => {
  const newState = {
    ...state,
    aiInsight: {
      text,
      timestamp: Date.now()
    }
  };
  saveData(newState);
  return newState;
};

// --- VENDOR MANAGEMENT FUNCTIONS ---

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
