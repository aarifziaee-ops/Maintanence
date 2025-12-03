
import { AppState, Flat, PaymentStatus, Transaction } from '../types';
import { STORAGE_KEY, TOTAL_FLATS } from '../constants';
import * as XLSX from 'xlsx';

// Raw data provided by user - specific 231 flats
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
  ["B-0908", "Sanjay DadaBhau Nikam", "9820849282"],
  ["B-1001", "Somnath Kaskar( vinaywadi gramastha mandal)", "9769307281"],
  ["B-1002", "Ganpat Sakharam Chavan", "9702427611"],
  ["B-1003", "Santosh Bhalekar(bhalekar gramast mandal)", "9869784325"],
  ["B-1004", "Dayanand Hari Patil", "9930929755"],
  ["B-1005", "Ramchandra Dongre", "7506244379"],
  ["B-1006", "Babaji Rama Rane( devkandgoan gramastha mandal)", "9920390762/8452062928"],
  ["B-1007", "Vijay Jagannath Gawde", "9969114332"],
  ["B-1008", "Mohan Ganpat Hande", "9969619264"],
  ["B-1101", "Sunil Ghune", "9819110211"],
  ["B-1102", "Manju Gupta", "9820694410"],
  ["B-1103", "Shabbir H Oliya", "9664826370"],
  ["B-1104", "Alka Shivram Bangar", "9820084598"],
  ["B-1105", "Suresh B Mane", ""],
  ["B-1106", "Santosh Raghunath Narkar", "9769931871"],
  ["B-1107", "Kishori Rajaram Pange", "9870175483 / 9870163502"],
  ["B-1108", "Prakash Aatmaram Patankar", "9619224490"],
  ["B-1201", "Nooruddin jethajwala", "9.72E+11"],
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
  ["B-1307", "Asif Ali Kondkar", "9029901470"],
  ["B-1308", "Siraj M Kazi", "9322912100"],
  ["B-1401", "Sajid Liyakat Mukri", "7900046246"],
  ["B-1402", "Jamila Alim Waghoo", "9892323543/8850497100"],
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
  ["B-1507", "Hayat Usman Jaitapkar", "9892877223"],
  ["B-1508", "Gulam Ali Khan", ""],
  ["B-1601", "Abida Imtiyaz Kazi", "9004174320"],
  ["B-1602", "Abdul Razak Malim", "9223511661"],
  ["B-1603", "junaid Pathan", "9839410360"],
  ["B-1604", "Imran Agwan", "9967000050"],
  ["B-1605", "Abdul Wahab Shaikh", "9870081659"],
  ["B-1606", "Khurshid Ahmed Shaikh", "9821106721"],
  ["B-1607", "Akram Bastavi", "9819271749"],
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
  ["B-1802", "Nafiz Ahmed Khan", "9321985350"],
  ["B-1803", "Nisar Ahmed Qureshi", "9773728523"],
  ["B-1804", "Abdul Razzak Khan", "8108786173"],
  ["B-1805", "Mushtaq noor Mohammed Shaikh", "9821444043"],
  ["B-1806", "Abdul Suleman Agwan", "8369529658"],
  ["B-1807", "Aslam Balbale", "9892992907"],
  ["B-1808", "Nazir Mapari", "8082433491"],
  ["B-1901", "Mohammed Haneef Sayyed", "8979529554"],
  ["B-1902", "Imtiyaz Malim", "9769223582"],
  ["B-1903", "Nadeem Ali Meera", "9372674616"],
  ["B-1904", "Ejaz Abdul Razzak Malim", "9022343603"],
  ["B-1905", "Fatima Kutubuddin Bakkar", "8650241022"],
  ["B-1906", "Mohammad Saeed Mimli", "9820773577"],
  ["B-1907", "Jahida Mohidin Malim", "9987651839"],
  ["B-1908", "Naseema Abdus Sattar Nakhwa", "8422968805"],
  ["B-2001", "Mohammed Khalid Sayyed", "9920347006"],
  ["B-2002", "Razia Shoukat Malim", "9222062959 / 9869278885"],
  ["B-2003", "Zameer Ahmed Siddique", "8655111093"],
  ["B-2004", "close", ""],
  ["B-2005", "Farah Mohammed Thakur", "9323825179"],
  ["B-2006", "Arifa Anwar Kazi / Asif Shaikh Ali", "9967822407/ 7710964862"],
  ["B-2007", "Ismail Abbas Mukri", "9082189919"],
  ["B-2008", "A Rehman A Monye", "9224653656"],
  ["B-2101", "Gulshan Rafique Ahmed Kazi", "7400145402"],
  ["B-2102", "Farzana Mehmood Shaikh", "9769950256"],
  ["B-2103", "Altaf Adil Choudhary", "9824246911"],
  ["B-2104", "Shafi Nagori", "9172258611"],
  ["B-2105", "Mohd faizuddin mohd iliyasuddin", "7336007848"],
  ["B-2106", "Salim Abdul Razzak Sayyed", "9004574051"],
  ["B-2107", "Hafiz Mohammed Khan", "9769482205"],
  ["B-2108", "Moinuddin Ali Darwan", "8657624040"],
  ["B-2301", "Shabana M Jagirdaar", "9702244757"],
  ["B-2302", "Farooq Ahmed", ""],
  ["B-2303", "Shatish shanbag", "7019510468"],
  ["B-2306", "Annapurna Pandey", "9820488951"],
  ["B-2307", "", ""],
  ["B-2308", "Hamza Saifuddin Poonawala", "9619076547"],
  ["B-2401", "Kaleemulla Usman Kasu", "9702162234"],
  ["B-2402", "Fahim Kasam Ibrahim Balbale", "9867786191"],
  ["B-2403", "Raees Boblai", "9820773577"],
  ["B-2404", "Raees Boblai", "9820773577"],
  ["B-2405", "Shaukat Mukri", "8286320711"],
  ["B-2406", "Faizan Abdur Rehman Bargir", "8082368967"],
  ["B-2407", "Fatimabi Abdul Hamid Waghoo", "9619048121"],
  ["B-2408", "Haseena H Lambe", "9892306688 / 9920275891"],
  ["B-2501", "Majeebullah haji Chaudhary", "8433897892"],
  ["B-2502", "Majeebullah haji Chaudhary", "8433897892"],
  ["B-2503", "Ashraf Ibrahim Karvinkar", "9820961623"],
  ["B-2504", "Abdul Ghani Hussain Attar", "9892177505"],
  ["B-2505", "Firoz A Udaipurwala", "9892245097"],
  ["B-2506", "Rehana Shamsuddin shaikh", "9892245097"],
  ["B-2507", "Shabbir Abbas Bhai Sapatwala", "9869905700"],
  ["B-2508", "close", ""],
  ["B-2601", "Salim Abbas Kazi", "7045760207"],
  ["B-2602", "Salim Abbas Kazi", "7045760207"],
  ["B-2603", "Ejaz Mohammed Khan", "9867386747"],
  ["B-2604", "Imran Siddique", ""],
  ["B-2605", "Aziz Shaikh [Musab]", "9773581986"],
  ["B-2606", "Rizwan Rakhangi", "971505467623 {UAE}"],
  ["B-2607", "Zaibunnissa Rakhangi", "971505467623 {UAE}"],
  ["B-2608", "juned Rakhangi", "971505467623 {UAE}"],
  ["B-2701", "Imran Girkar", "8898388928"],
  ["B-2702", "Imran Girkar", "8898388928"],
  ["B-2703", "Anwar Girkar", "9029498165"],
  ["B-2704", "Shama S Mukri", "9773868668"],
  ["B-2705", "Nizamuddin Khan", "9029176349"],
  ["B-2706", "Dilshad Nisar Mukri", "9029042758"],
  ["B-2707", "Kafiya Parven Shaikh", "7977578498"],
  ["B-2708", "Mohsin M Mukri", "9773580859"],
  ["B-2801", "Umrethwala Mansoor Ebrahim", "9969667518"],
  ["B-2802", "Raziya Bashir Khan", "8369804892"],
  ["B-2803", "Riyaz Abdus Sattar kazi", "8286682016"],
  ["B-2804", "Haseena Barmare", "8286954620"],
  ["B-2805", "Afroz Ashfaq Sayyed", "8355862219"],
  ["B-2806", "banu Ibrahim khan (Court Case)", ""],
  ["B-2807", "inayat kazi", "9833210072 / 9222071973"],
  ["B-2808", "Farida Rashid Agha", "9773157792"],
  ["B-2901", "Fahmida A khan", "9372887837"],
  ["B-2902", "Haneef Kadar Agwan", "9987570045"],
  ["B-2903", "Sadiq Ratansi", ""],
  ["B-2904", "Shabina Altaf Vasta", "9224678109"],
  ["B-2905", "Madrasa Talimul Quraan", "9821384777"],
  ["B-2906", "mohammed Tole", "9004594996"],
  ["B-2907", "jamat ul muslimeen", "9004594996"],
  ["B-2908", "Zubair Anwar Mukri", "7900129259"],
  ["B-3001", "Abdul Rauf Mohammed Khan", "9221156574"],
  ["B-3002", "jamat ul muslimeen", "9221768090"],
  ["B-3003", "Jayvanti S Gala", "9833585758"],
  ["B-3006", "Sushil S Gala", "9322596594"],
  ["B-3007", "Noor Mohammed Khan", "8879151312"],
  ["B-3008", "Ebrahim Abbas Yahoo", "9699655674"],
  ["B-3101", "Shaikh Abizar bhai Lakdawala", "9820913967"],
  ["B-3102", "Kaiser Merchant (Advocate)", ""],
  ["B-3103", "", ""],
  ["B-3104", "", ""],
  ["B-3105", "Usman shaikh", "9137224620"],
  ["B-3106", "fareeda kasam khan", "9969337306"],
  ["B-3107", "Rizwan Khan", ""],
  ["B-3108", "isha khan", "9930193760"],
  ["B-3201", "Husaini", ""],
  ["B-3202", "Anees Cyclewala", ""],
  ["B-3203", "Samina Safri", ""],
  ["B-3204", "sunehwala", ""],
  ["B-3205", "Murtaza Dahodwala", ""],
  ["B-3206", "Shabbir Dohadwala", ""],
  ["B-3207", "Malik", ""],
  ["B-3208", "Juzer Ghadiyali", ""],
  ["B-3301", "Shabbir OfficeWala", ""],
  ["B-3302", "Yunus Officewala", ""],
  ["B-3303", "Samina Sutterwala", ""],
  ["B-3304", "Samina Sutterwala", ""],
  ["B-3305", "Nisreen Kapasi", ""],
  ["B-3306", "Dr.Fatima Jetpurwala", ""],
  ["B-3307", "Akbar Obri", ""],
  ["B-3308", "Galiwala", ""],
  ["B-3401", "Dhanaliwala", ""],
  ["B-3402", "Mohammed Hirani", ""],
  ["B-3403", "T. Jaorawala", ""],
  ["B-3404", "Jaorawala", ""],
  ["B-3405", "Habib", ""],
  ["B-3406", "Habib", ""],
  ["B-3407", "Mankada", ""],
  ["B-3408", "Neemuchwala", ""],
  ["B-3501", "Amravatiwala", ""],
  ["B-3502", "Abde Mustansir Rampurwala", ""],
  ["B-3503", "Sarafali Painter", ""],
  ["B-3504", "Taher Indorewala", ""],
  ["B-3505", "Devasliwala", ""],
  ["B-3506", "Devasliwala", ""],
  ["B-3507", "Yusuf Gallam", ""],
  ["B-3508", "A Ghadiyali", ""],
  ["B-3601", "Salman Bharmal", ""],
  ["B-3602", "", ""],
  ["B-3603", "Bhanpurawala", ""],
  ["B-3604", "Khozema Aggarwala", ""],
  ["B-3605", "Samina Husain", ""],
  ["B-3606", "Fatema Merchant", ""],
  ["B-3607", "Shabbir Ladhi", ""],
  ["B-3608", "Shabbir Ladhi", ""],
  ["B-3701", "Kathawala", ""],
  ["B-3702", "Zainab Dhankot", ""],
  ["B-3703", "Rashid Patanwala", ""],
  ["B-3705", "Builders unsold flats", ""],
  ["B-3706", "Builders unsold flats", ""],
  ["B-3707", "Mehjabeen Randhanpurwala", ""],
  ["B-3708", "Hussain Udaipurwala", ""],
  ["B-3801", "Poonawala", ""],
  ["B-3802", "Rangwala", ""],
  ["B-3803", "Sakina Aftab", ""],
  ["B-3804", "Sakina Aftab", ""],
  ["B-3805", "Builders unsold flats", ""],
  ["B-3806", "Builders unsold flats", ""],
  ["B-3807", "Abdul Tayyab Misri", ""],
  ["B-3808", "Aziz Ratlamwala", ""]
];

const getInitialState = (): AppState => {
  const flats: Flat[] = [];
  
  // Use the specific list provided
  INITIAL_FLAT_DATA.forEach((row) => {
    const flatNo = row[0];
    const owner = row[1];
    const mob = row[2];

    if (flatNo) {
       flats.push({
          id: flatNo,
          flatNumber: flatNo,
          ownerName: owner || '',
          mobile: mob || '',
          status: PaymentStatus.UNPAID
       });
    }
  });

  return {
    flats,
    transactions: [],
    lastReceiptNo: 0, 
    aiInsight: undefined
  };
};

export const loadData = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const initial = getInitialState();
  saveData(initial);
  return initial;
};

export const saveData = (data: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const updateInsight = (currentState: AppState, text: string): AppState => {
  const newState = {
    ...currentState,
    aiInsight: {
      text,
      timestamp: Date.now()
    }
  };
  saveData(newState);
  return newState;
};

export const processPayment = (
  currentState: AppState,
  flatId: string,
  ownerName: string,
  mobile: string,
  amount: number,
  customDate?: string // Format: YYYY-MM-DD
): { newState: AppState; transaction: Transaction } => {
  
  const newReceiptNo = currentState.lastReceiptNo + 1;
  
  let dateObj = new Date();
  if (customDate) {
    // Append T12:00:00 to ensure date is parsed as local noon, preventing timezone shifts 
    // (e.g., UTC midnight appearing as previous day in Western hemisphere)
    const validCheck = new Date(`${customDate}T12:00:00`);
    if (!isNaN(validCheck.getTime())) {
        dateObj = validCheck;
    }
  }
  
  const timestamp = dateObj.getTime();
  const dateStr = dateObj.toISOString();

  const flatIndex = currentState.flats.findIndex(f => f.id === flatId);
  if (flatIndex === -1) throw new Error("Flat not found");

  const updatedFlats = [...currentState.flats];
  updatedFlats[flatIndex] = {
    ...updatedFlats[flatIndex],
    ownerName: ownerName, // Update owner name if provided
    mobile: mobile,
    status: PaymentStatus.PAID
  };

  const newTransaction: Transaction = {
    receiptNo: newReceiptNo,
    date: dateStr,
    timestamp,
    flatId,
    flatNumber: updatedFlats[flatIndex].flatNumber,
    ownerName,
    amount,
    mobile
  };

  const newState: AppState = {
    ...currentState, // Preserve insight and other future fields
    flats: updatedFlats,
    transactions: [newTransaction, ...currentState.transactions],
    lastReceiptNo: newReceiptNo
  };

  saveData(newState);
  return { newState, transaction: newTransaction };
};

export const deleteTransaction = (currentState: AppState, receiptNo: number): AppState => {
  const transaction = currentState.transactions.find(t => t.receiptNo === receiptNo);
  if (!transaction) return currentState;

  // Remove transaction
  const updatedTransactions = currentState.transactions.filter(t => t.receiptNo !== receiptNo);

  // Revert flat status to UNPAID
  const flatIndex = currentState.flats.findIndex(f => f.id === transaction.flatId);
  const updatedFlats = [...currentState.flats];
  
  if (flatIndex !== -1) {
    updatedFlats[flatIndex] = {
      ...updatedFlats[flatIndex],
      status: PaymentStatus.UNPAID
    };
  }

  // Smart Rollback: If we deleted the very last generated receipt, decrement the counter.
  let newLastReceiptNo = currentState.lastReceiptNo;
  if (receiptNo === currentState.lastReceiptNo) {
    newLastReceiptNo = currentState.lastReceiptNo - 1;
  }

  const newState = {
    ...currentState,
    flats: updatedFlats,
    transactions: updatedTransactions,
    lastReceiptNo: newLastReceiptNo
  };

  saveData(newState);
  return newState;
};

export const updateTransaction = (
  currentState: AppState, 
  receiptNo: number, 
  updates: { ownerName: string; mobile: string; amount: number; date?: string }
): AppState => {
  const txIndex = currentState.transactions.findIndex(t => t.receiptNo === receiptNo);
  if (txIndex === -1) return currentState;

  const originalTx = currentState.transactions[txIndex];
  const updatedTransactions = [...currentState.transactions];
  
  let newDateStr = originalTx.date;
  let newTimestamp = originalTx.timestamp;

  if (updates.date) {
    const validCheck = new Date(`${updates.date}T12:00:00`);
    if (!isNaN(validCheck.getTime())) {
        const dateObj = validCheck;
        newDateStr = dateObj.toISOString();
        newTimestamp = dateObj.getTime();
    }
  }
  
  // Update Transaction
  updatedTransactions[txIndex] = {
    ...originalTx,
    ownerName: updates.ownerName,
    mobile: updates.mobile,
    amount: updates.amount,
    date: newDateStr,
    timestamp: newTimestamp
  };

  // Update associated Flat details to keep sync
  const flatIndex = currentState.flats.findIndex(f => f.id === originalTx.flatId);
  const updatedFlats = [...currentState.flats];
  if (flatIndex !== -1) {
    updatedFlats[flatIndex] = {
      ...updatedFlats[flatIndex],
      ownerName: updates.ownerName,
      mobile: updates.mobile
    };
  }

  const newState = {
    ...currentState,
    flats: updatedFlats,
    transactions: updatedTransactions
  };

  saveData(newState);
  return newState;
};

export const updateFlatsFromCSV = (currentState: AppState, csvContent: string): { newState: AppState, updatedCount: number, errors: string[] } => {
    const lines = csvContent.split(/\r\n|\n/);
    const updatedFlats = [...currentState.flats];
    let updatedCount = 0;
    const errors: string[] = [];

    // Skip header assuming first row is header if it contains 'FlatNumber'
    const startRow = lines[0].toLowerCase().includes('flatnumber') ? 1 : 0;

    for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split
        const parts = line.split(',');
        if (parts.length < 1) continue;

        const flatNo = parts[0].trim();
        const cleanFlatNo = flatNo.replace(/^["']|["']$/g, '');
        
        const ownerName = parts[1] ? parts[1].trim().replace(/^["']|["']$/g, '') : '';
        const mobile = parts[2] ? parts[2].trim().replace(/^["']|["']$/g, '') : '';

        // Find flat
        const flatIndex = updatedFlats.findIndex(f => f.flatNumber.toLowerCase() === cleanFlatNo.toLowerCase());
        
        if (flatIndex !== -1) {
            updatedFlats[flatIndex] = {
                ...updatedFlats[flatIndex],
                ownerName: ownerName || updatedFlats[flatIndex].ownerName,
                mobile: mobile || updatedFlats[flatIndex].mobile
            };
            updatedCount++;
        }
    }

    const newState = {
        ...currentState,
        flats: updatedFlats
    };
    saveData(newState);
    return { newState, updatedCount, errors };
};

// --- EXCEL DATABASE FUNCTIONS ---

// Helper to parse dates that might be in various formats (ISO, DD/MM/YYYY, etc)
const parseDateRobust = (dateStr: string, timeStr: string = ''): { iso: string, ts: number } => {
  if (!dateStr) {
     const now = new Date();
     return { iso: now.toISOString(), ts: now.getTime() };
  }

  // Normalize separators
  let cleanDateStr = dateStr.trim();
  
  // DETECT FORMAT: DD/MM/YYYY or D/M/YYYY
  const dmyMatch = cleanDateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; 
    const year = parseInt(dmyMatch[3], 10);
    
    // Default to NOON (12:00:00) if no time is specified.
    // This prevents timezone rollovers where Local Midnight -> Previous Day UTC.
    // e.g. India (UTC+5:30) Midnight -> Previous Day 18:30 UTC.
    let hours = 12; 
    let minutes = 0;
    let seconds = 0;

    if (timeStr) {
       const timeMatch = timeStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?/i);
       if (timeMatch) {
         hours = parseInt(timeMatch[1], 10);
         minutes = parseInt(timeMatch[2], 10);
         seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
         const meridiem = timeMatch[4]?.toUpperCase();
         if (meridiem === 'PM' && hours < 12) hours += 12;
         if (meridiem === 'AM' && hours === 12) hours = 0;
       }
    }

    const d = new Date(year, month, day, hours, minutes, seconds);
    return { iso: d.toISOString(), ts: d.getTime() };
  }

  // Fallback to standard constructor
  // Case 2: Handle standard YYYY-MM-DD (ISO) or MM/DD/YYYY (US)
  // To avoid local midnight shifting to previous day UTC in positive timezones (East of UK),
  // we try to force noon if it looks like a date-only string.
  let fullStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
  
  // Heuristic: If it has slashes (often implied local time) but no time component, append Noon.
  // We leave dashes (YYYY-MM-DD) alone because new Date("2023-10-01") is officially UTC in JS.
  if (!timeStr && dateStr.includes('/') && !dateStr.includes(':')) {
       fullStr = `${dateStr} 12:00:00`;
  }

  const d = new Date(fullStr);
  if (!isNaN(d.getTime())) {
    return { iso: d.toISOString(), ts: d.getTime() };
  }
  
  // Final fallback (just dateStr)
  const d2 = new Date(dateStr);
  if (!isNaN(d2.getTime())) {
    return { iso: d2.toISOString(), ts: d2.getTime() };
  }

  console.warn("Failed to parse date:", fullStr);
  const fallback = new Date();
  return { iso: fallback.toISOString(), ts: fallback.getTime() };
};

export const importTransactionsFromCSV = (currentState: AppState, csvContent: string): { newState: AppState, count: number, errors: string[] } => {
    const lines = csvContent.split(/\r\n|\n/);
    const newTransactions: Transaction[] = [];
    const updatedFlats = [...currentState.flats];
    const errors: string[] = [];
    
    // Track receipt number for auto-generation
    let currentReceiptNo = currentState.lastReceiptNo;

    // Basic Header Detection
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('date') && header.includes('flat');
    const startRow = hasHeader ? 1 : 0;

    for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        // Expected: Date, FlatNumber, Amount, ReceiptNo (Optional), OwnerName(Optional)
        
        const dateStr = parts[0]?.trim();
        const flatNo = parts[1]?.trim();
        const amountStr = parts[2]?.trim();
        const receiptStr = parts[3]?.trim();
        const ownerStr = parts[4]?.trim(); // Optional override

        if (!dateStr || !flatNo || !amountStr) {
             errors.push(`Row ${i + 1}: Missing required fields (Date, FlatNumber, Amount)`);
             continue;
        }

        // Validate Flat
        const flatIndex = updatedFlats.findIndex(f => f.flatNumber.toLowerCase() === flatNo.toLowerCase());
        if (flatIndex === -1) {
            errors.push(`Row ${i + 1}: Flat ${flatNo} not found.`);
            continue;
        }

        const flat = updatedFlats[flatIndex];
        
        // Parse Amount - Remove commas if present (e.g., "2,000")
        const cleanAmountStr = amountStr.replace(/,/g, '');
        const amount = parseFloat(cleanAmountStr);
        if (isNaN(amount)) {
            errors.push(`Row ${i + 1}: Invalid amount.`);
            continue;
        }

        // Parse Date Robustly
        const { iso: isoDate, ts: timestamp } = parseDateRobust(dateStr);

        // Handle Receipt No
        let receiptNo = 0;
        if (receiptStr) {
            receiptNo = parseInt(receiptStr);
            if (isNaN(receiptNo)) {
                 // Fallback to auto-inc if invalid number provided
                 currentReceiptNo++;
                 receiptNo = currentReceiptNo;
            } else {
                 // Update max counter if manual receipt is higher
                 if (receiptNo > currentReceiptNo) {
                     currentReceiptNo = receiptNo;
                 }
            }
        } else {
            currentReceiptNo++;
            receiptNo = currentReceiptNo;
        }

        // Create Transaction
        const newTx: Transaction = {
            receiptNo,
            date: isoDate,
            timestamp,
            flatId: flat.id,
            flatNumber: flat.flatNumber,
            ownerName: ownerStr || flat.ownerName, // Use CSV name or existing flat name
            amount: amount,
            mobile: flat.mobile || ''
        };

        newTransactions.push(newTx);

        // Update Flat Status
        updatedFlats[flatIndex] = {
            ...flat,
            status: PaymentStatus.PAID
        };
    }

    if (newTransactions.length === 0) {
        return { newState: currentState, count: 0, errors };
    }

    // Merge transactions and sort by receiptNo desc
    const allTransactions = [...currentState.transactions, ...newTransactions];
    allTransactions.sort((a, b) => b.receiptNo - a.receiptNo);

    const newState: AppState = {
        ...currentState,
        flats: updatedFlats,
        transactions: allTransactions,
        lastReceiptNo: currentReceiptNo
    };

    saveData(newState);
    return { newState, count: newTransactions.length, errors };
};

export const exportDataToExcel = (state: AppState) => {
  // 1. Prepare Flats Data
  const flatsData = state.flats.map(f => ({
    'Flat Number': f.flatNumber,
    'Owner Name': f.ownerName,
    'Mobile': f.mobile || '',
    'Status': f.status
  }));

  // 2. Prepare Transactions Data
  const transactionsData = state.transactions.map(t => ({
    'Receipt No': t.receiptNo,
    'Date': new Date(t.date).toLocaleDateString(),
    'Time': new Date(t.date).toLocaleTimeString(),
    'Flat Number': t.flatNumber,
    'Owner Name': t.ownerName,
    'Mobile': t.mobile,
    'Amount': t.amount,
    'Timestamp': t.timestamp, // Hidden field for robust restore
    'ISO Date': t.date,       // Hidden field for robust restore
  }));

  // 3. System Data
  const systemData = [{
    'Last Receipt No': state.lastReceiptNo,
    'Total Flats': state.flats.length,
    'Export Date': new Date().toISOString()
  }];

  // 4. Create Workbook
  const wb = XLSX.utils.book_new();
  
  const wsFlats = XLSX.utils.json_to_sheet(flatsData);
  const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
  const wsSystem = XLSX.utils.json_to_sheet(systemData);

  XLSX.utils.book_append_sheet(wb, wsFlats, "Flats");
  XLSX.utils.book_append_sheet(wb, wsTransactions, "Transactions");
  XLSX.utils.book_append_sheet(wb, wsSystem, "System");

  // 5. Download
  const fileName = `Continental_Heights_DB_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const importDataFromExcel = async (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Use ArrayBuffer for better compatibility
    reader.readAsArrayBuffer(file);
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Fix for Excel editing corrupting types: use cellDates: true to correctly parse dates as JS Date objects
        const wb = XLSX.read(data, { type: 'array', cellDates: true });

        // Validate Sheets
        if (!wb.SheetNames.includes('Flats') || !wb.SheetNames.includes('Transactions')) {
          reject(new Error("Invalid Database File. 'Flats' or 'Transactions' sheet missing."));
          return;
        }

        // Helper to find header row (some people add a title row at top)
        const findHeaderRow = (sheet: any, key: string) => {
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          for (let i = 0; i < Math.min(10, json.length); i++) {
            if (json[i].some(cell => String(cell).trim() === key)) return i;
          }
          return 0;
        };

        // Parse Flats
        const flatHeaderRow = findHeaderRow(wb.Sheets['Flats'], 'Flat Number');
        const flatsRaw = XLSX.utils.sheet_to_json(wb.Sheets['Flats'], { range: flatHeaderRow }) as any[];
        
        const flats: Flat[] = flatsRaw.map(row => ({
          id: row['Flat Number'],
          flatNumber: row['Flat Number'],
          ownerName: row['Owner Name'] || '',
          mobile: row['Mobile'] ? String(row['Mobile']) : undefined,
          status: row['Status'] as PaymentStatus || PaymentStatus.UNPAID
        }));

        // Parse Transactions
        const txHeaderRow = findHeaderRow(wb.Sheets['Transactions'], 'Receipt No');
        const txRaw = XLSX.utils.sheet_to_json(wb.Sheets['Transactions'], { range: txHeaderRow }) as any[];
        
        const transactions: Transaction[] = txRaw.map(row => {
          if (!row['Receipt No']) return null; // Skip empty rows

          let dateStr = '';
          let timestamp = 0;

          // Priority 1: Use hidden ISO fields if they exist
          if (row['ISO Date']) {
            dateStr = row['ISO Date'];
            timestamp = row['Timestamp'] ? Number(row['Timestamp']) : new Date(dateStr).getTime();
          } 
          // Priority 2: Attempt to parse Date column (which might be a JS Date object now thanks to cellDates: true)
          else if (row['Date'] instanceof Date) {
             dateStr = row['Date'].toISOString();
             timestamp = row['Date'].getTime();
          }
          // Priority 3: Parse robustly
          else {
            const parsed = parseDateRobust(row['Date'], row['Time']);
            dateStr = parsed.iso;
            timestamp = parsed.ts;
          }

          return {
            receiptNo: Number(row['Receipt No']),
            date: dateStr,
            timestamp: timestamp,
            flatId: row['Flat Number'],
            flatNumber: row['Flat Number'],
            ownerName: row['Owner Name'],
            amount: Number(row['Amount']),
            mobile: String(row['Mobile'])
          };
        }).filter(t => t !== null) as Transaction[];

        // Parse System (for LastReceiptNo)
        let lastReceiptNo = 0;
        if (wb.SheetNames.includes('System')) {
          const sysRaw = XLSX.utils.sheet_to_json(wb.Sheets['System']) as any[];
          if (sysRaw.length > 0) {
            lastReceiptNo = Number(sysRaw[0]['Last Receipt No']);
          }
        } else {
            // Fallback: calculate from transactions
            lastReceiptNo = transactions.reduce((max, t) => Math.max(max, t.receiptNo), 0);
        }

        const newState: AppState = {
          flats,
          transactions,
          lastReceiptNo,
          aiInsight: undefined
        };

        saveData(newState);
        resolve(newState);

      } catch (err) {
        console.error("Excel Import Error:", err);
        reject(new Error("Failed to parse Excel file. Ensure it is a valid backup."));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    }
  });
};
