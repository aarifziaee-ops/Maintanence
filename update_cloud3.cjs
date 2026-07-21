const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const HARDCODED_CONFIG = {
  apiKey: "AIzaSyAcFWaCkEMT8pdNwCyNhPrbbr9I7EPbImA",
  authDomain: "continental-heights-b-wi-21189.firebaseapp.com",
  projectId: "continental-heights-b-wi-21189"
};

const app = initializeApp(HARDCODED_CONFIG);
const db = getFirestore(app);

const COLLECTION_NAME = 'app_data';
const DOC_ID = 'main_db';

async function run() {
  const docRef = doc(db, COLLECTION_NAME, DOC_ID);
  const docSnap = await getDoc(docRef);
  let state = { flats: [], transactions: [], financialRecords: [], hallBookings: [], vendors: [], lastReceiptNo: 0 };
  if (docSnap.exists()) {
    state = docSnap.data();
  }

  const csvStr = `Date,Flat Number,Amount,Receipt No,Owner Name
20-11-2025,B-0801,500,199,Mangesh Chindarkar
12-11-2025,B-0802,500,148,Dattaram Babu Birambole
08-11-2025,B-0803,500,62,Ankita Atul Khochre
07-11-2025,B-0806,500,20,Rajesh Mahadik
20-11-2025,B-0807,500,200,Sitaram Bandhu Ambre
08-11-2025,B-0808,500,61,Sudhir Motiram Kudalkar
15-12-2025,B-0901,500,216,Vijay Bhujhang Rane
14-11-2025,B-0902,500,174,Mahendra krishna Sawant
08-11-2025,B-0903,500,75,Rajendra Ramhari Jaiswal
17-11-2025,B-0904,500,194,Shobha Raju Wagheela
20-11-2025,B-0905,500,201,Tushar Gajanan Raut
16-11-2025,B-0906,500,192,Mohammad Asad Mujtaba Siddiqui
08-11-2025,B-0907,500,73,Bhikaji Shantaram Gaokar
09-11-2025,B-0908,500,94,Sanjay DadaBhau Nikam
13-11-2025,B-1001,500,163,vinaywadi gramastha mandal (Somnath Kasar)
08-11-2025,B-1002,500,71,Ganpat Sakharam Chavan
08-11-2025,B-1003,500,74,Santosh Bhalekar(bhalekar gramast mandal)
15-11-2025,B-1004,500,177,Dayanand Hari Patil
15-11-2025,B-1005,500,182,Ramchandra Dongre
08-11-2025,B-1006,500,53,Babaji Rama Rane( devkandgoan gramastha mandal)
15-11-2025,B-1007,500,178,Vijay Jagannath Gawde
08-11-2025,B-1008,500,72,Mohan Ganpat Hande
14-11-2025,B-1101,500,166,Sunil Ghune
16-11-2025,B-1102,500,187,Manju Jitendra Gupta
19-11-2025,B-1103,500,196,Shabbir H Oliya
15-11-2025,B-1104,500,179,Alka Shivram Bangar
13-11-2025,B-1105,500,156,Suresh B Mane
15-11-2025,B-1106,500,181,Santosh Raghunath Narkar
23-11-2025,B-1107,500,207,Kishori Rajaram Pange
20-11-2025,B-1108,500,202,Prakash Aatmaram Patankar
23-11-2025,B-1201,500,206,Nooruddin jethajwala
13-11-2025,B-1202,500,158,Shaikh Abizar bhai lakdawala
13-11-2025,B-1203,500,159,Tasneem Jariwala
13-11-2025,B-1204,500,160,Fatima sidhpurwala
14-11-2025,B-1206,500,175,Mamta Mahindra Sawant
11-11-2025,B-1207,500,144,Kafiya Parveen Shaikh
15-11-2025,B-1208,500,183,Hatim Mithaiwala
07-11-2025,B-1301,500,36,Mohammed Ibrahim Sheikh
21-11-2025,B-1303,500,205,Sharafat Ali Mukri
08-11-2025,B-1304,500,66,Sharfuddin Khan
07-11-2025,B-1305,500,32,Arif Liyakat Mukri
15-11-2025,B-1306,500,186,Rabiya M. Naik
17-11-2025,B-1307,500,193,Afzal Waghoo (Asif Ali Kondkar)
12-11-2025,B-1308,500,147,Siraj M Kazi
07-11-2025,B-1401,500,16,Sajid Liyakat Mukri
07-11-2025,B-1402,500,15,Jamila Alim Waghoo
09-11-2025,B-1403,500,89,Mukhtar Abbas Mungi
07-11-2025,B-1404,500,1,Mohammed Tole
07-11-2025,B-1405,500,9,Jamaat ul Muslimeen (Abdul Rehman Thange / Aziz Barmare)
10-11-2025,B-1406,500,118,Aqila Ata Hussain
08-11-2025,B-1407,500,68,Jamaluddin Wadekar
11-11-2025,B-1408,500,135,Tahirabi Abdul Razzak Mulla
11-11-2025,B-1501,500,140,Haneef Kadar Agwan
08-11-2025,B-1502,500,60,Azizullah Shorat Ali Hajjam
11-11-2025,B-1503,500,141,Premlata Naresh Shahu
10-11-2025,B-1506,500,122,Eknath Sangvekar
08-11-2025,B-1507,500,54,Hayatbi Usman Jaitapkar
13-11-2025,B-1508,500,162,Gulam Ali Khan
15-11-2025,B-1601,500,184,Abida Imtiyaz Kazi
07-11-2025,B-1602,500,48,Abdul Razak Malim
08-11-2025,B-1603,500,55,Israr Ahmed Khan
09-11-2025,B-1604,500,93,Imran Agwan
12-11-2025,B-1605,500,154,Abdul Wahab Shaikh
15-11-2025,B-1606,500,185,Khurshid Ahmed Shaikh
10-12-2025,B-1607,500,214,Mohammad Akram Abdul Hai Bastivi
16-11-2025,B-1608,500,188,Abdul Qadir Shaikh
07-11-2025,B-1701,500,30,Rashida Yusuf Hajju
09-11-2025,B-1702,500,111,Liyakat Ali Mohammed Khan
08-11-2025,B-1703,500,51,Munira Karim Waghoo
11-11-2025,B-1704,500,139,Haneef Kadar Agwan
08-11-2025,B-1705,500,52,Munira Karim Waghoo
08-11-2025,B-1706,500,56,Hamida Khan
07-11-2025,B-1707,500,19,Imran Siddique
07-11-2025,B-1708,500,23,Sajid Karim Thakur
11-11-2025,B-1801,500,137,Ebrahim Abbas Yahoo
12-11-2025,B-1802,500,146,Nafis Ahmed Khan
19-11-2025,B-1803,500,198,Rabiya Khatoon Nisar Ahmed Qureshi
07-11-2025,B-1804,500,33,Abdul Razzak Khan
16-11-2025,B-1805,500,190,Mushtaq noor Mohammed Shaikh
11-11-2025,B-1806,500,142,Abdul Suleman Agwan
10-11-2025,B-1807,500,130,Aslam Balbale
09-11-2025,B-1808,500,99,Imran Nazir Mapari
11-11-2025,B-1901,500,143,Mohammed Haneef Sayyed
10-11-2025,B-1902,500,112,Shabnam Imtiyaz Malim
07-11-2025,B-1903,500,34,Nadim Ali Mira
07-11-2025,B-1904,500,47,Ejaz Abdul Razzak Malim
10-11-2025,B-1905,500,113,Fatima Kutubuddin Bakkar
10-11-2025,B-1906,500,115,Saeed Khalique Mimli
10-11-2025,B-1907,500,114,Jahida Mohidin Malim
12-11-2025,B-1908,500,150,Naseema Abdus Sattar Nakhwa
12-11-2025,B-2001,500,145,Mohammed Khalid Sayyed
07-11-2025,B-2002,500,21,Razia Shoukat Malim/ Shoukat Adam Malim
15-11-2025,B-2003,500,180,Zameer Ahmed Siddiqui
08-11-2025,B-2005,500,50,Farah Mohammed Thakur
14-11-2025,B-2006,500,170,Arifa Anwar Kazi / Asif Shaikh Ali
15-11-2025,B-2007,500,176,Ismail Abbas Mukri
25-11-2025,B-2008,500,210,A Rehman A Monye
07-11-2025,B-2101,500,24,Gulshan Rafique Ahmed Kazi
08-11-2025,B-2102,500,69,Farzana Mehmood Shaikh
08-11-2025,B-2103,500,57,Altaf Adil Choudhary
08-11-2025,B-2104,500,63,Mohammed Shafi Nagori
16-11-2025,B-2105,500,189,Mohd faizuddin mohd iliyasuddin
07-11-2025,B-2106,500,13,Salim Abdul Razzak Sayyed
12-11-2025,B-2107,500,152,Hafiz Mohammed Khan
07-11-2025,B-2108,500,17,Moinuddin Ali Darvan
13-11-2025,B-2301,500,164,Shabana M Jagirdaar
16-11-2025,B-2302,500,191,Farooque Ahmed
12-11-2025,B-2303,500,153,Shatish shanbag
12-11-2025,B-2306,500,151,Annapurna Pandey
14-11-2025,B-2308,500,168,Hamza Saifuddin Poonawala
14-11-2025,B-2401,500,173,Kalimulla Usman Kasu
08-11-2025,B-2402,500,86,Fahim Kasam Ibrahim Balbale
08-11-2025,B-2403,500,64,Rayees Abdul Rehman Boblai
08-11-2025,B-2404,500,65,Rayees Abdul Rehman Boblai
11-11-2025,B-2405,500,134,Shaukat Mukri
10-11-2025,B-2406,500,121,Faizan Abdur Rehman Bargir
07-11-2025,B-2407,500,7,Fatimabi Abdul Hamid Waghoo
25-11-2025,B-2408,500,211,Haseena H Lambe
14-11-2025,B-2501,500,171,Majeebullah haji Chaudhary
14-11-2025,B-2502,500,172,Majeebullah haji Chaudhary
07-11-2025,B-2503,500,49,Ashraf Ibrahim Karvinkar
07-11-2025,B-2504,500,8,Abdul Gani Husain Attar
07-11-2025,B-2505,500,4,Firoz A Udaipurwala
07-11-2025,B-2506,500,5,Rehana Shamsuddin shaikh
08-11-2025,B-2507,500,70,Shabbir Abbas Bhai Sapatwala
07-11-2025,B-2601,500,25,Salim Abbas Kazi
07-11-2025,B-2602,500,26,Salim Abbas Kazi
08-11-2025,B-2603,500,58,Ejaj Mohammed Khan
07-11-2025,B-2604,500,18,Imran Siddique
14-11-2025,B-2605,500,167,Aziz Shaikh [Musab]
07-11-2025,B-2606,500,27,Rizwan Rakhangi
07-11-2025,B-2607,500,28,Zaibunnissa Rakhangi
07-11-2025,B-2608,500,29,juned Rakhangi
09-11-2025,B-2701,500,91,Imran Girkar
09-11-2025,B-2702,500,92,Imran Girkar
09-11-2025,B-2703,500,90,Anwar Girkar
07-11-2025,B-2704,500,35,Shama Sharfuddin Mukri
07-11-2025,B-2705,500,6,Nizamuddin Khan
08-11-2025,B-2706,500,87,Dilshad Nisar Mukri
13-11-2025,B-2707,500,165,Kafiya Parven Shaikh
17-11-2025,B-2708,500,195,Mohsin M Mukri
10-11-2025,B-2801,500,116,Umrethwala Mansoor Ebrahim
07-11-2025,B-2802,500,22,Raziya Bashir Khan
10-11-2025,B-2803,500,119,Riyaz Abdus Sattar kazi
10-11-2025,B-2804,500,120,Abdus sattar Barmare
07-11-2025,B-2805,500,12,Afroz Ashfaq Sayyed
09-11-2025,B-2807,500,88,inayat kazi
10-11-2025,B-2808,500,123,Farida Rashid Agha
13-11-2025,B-2901,500,157,Fahmida A khan
11-11-2025,B-2902,500,138,Haneef Kadar Agwan
08-11-2025,B-2904,500,67,Shabina Altaf Vasta
10-11-2025,B-2905,500,117,Madrasa Talimul Quraan
07-11-2025,B-2906,500,2,mohammed Tole
07-11-2025,B-2907,500,10,jamat ul muslimeen (Mohammad Iqbal Tole / Abbas Mujawar)
09-11-2025,B-2908,500,107,Mohammed Hussain Jumma
07-11-2025,B-3001,500,14,Abdul Rauf Mohammed Khan
07-11-2025,B-3002,500,11,jamat ul muslimeen ( Mohiuddin Barmare / Ismail Kazi)
09-11-2025,B-3003,500,109,Jayvanti S Gala
09-11-2025,B-3006,500,110,Sushil S Gala
09-11-2025,B-3007,500,108,Noor Mohammed Khan
11-11-2025,B-3008,500,136,Ebrahim Abbas Yahoo
13-11-2025,B-3101,500,161,Shaikh Abizar bhai Lakdawala
03-12-2025,B-3102,500,213,Kaiser Merchant (Advocate)
07-11-2025,B-3105,500,31,Usman Ramzan shaikh
26-11-2025,B-3106,500,212,fareeda kasam khan
08-11-2025,B-3107,500,59,Rizavan Khan
07-11-2025,B-3108,500,3,isha khan
09-11-2025,B-3201,500,100,Aliasgar zohair Husaini
07-11-2025,B-3202,500,37,Anees Cyclewala
10-11-2025,B-3203,500,131,Samina Firoz Safri
07-11-2025,B-3204,500,38,sunehwala
23-11-2025,B-3205,500,209,Murtaza Dahodwala
31-03-2026,B-3206,500,217,Shabbir Dohadwala
21-11-2025,B-3208,500,204,Zuzer Zoheb Ghadiali
09-11-2025,B-3301,500,101,Shabbir Huseini OfficeWala
09-11-2025,B-3302,500,102,Yunus Shabbir Officewala
10-11-2025,B-3303,500,128,Samina Sutterwala
10-11-2025,B-3304,500,129,Samina Sutterwala
10-11-2025,B-3305,500,125,Nisreen Kapasi
10-11-2025,B-3306,500,124,Dr.Fatema Jetpurwala
14-11-2025,B-3307,500,169,Akbar Obri
07-11-2025,B-3308,500,39,Saleh Galiwala
09-11-2025,B-3401,500,105,Dhanaliwala
07-11-2025,B-3402,500,40,Mohammed Hirani
07-11-2025,B-3403,500,41,T. Jaorawala
07-11-2025,B-3404,500,42,Jaorawala
09-11-2025,B-3405,500,103,Shabbir Mansoor Habib
09-11-2025,B-3406,500,104,Mansoor Habib
07-11-2025,B-3407,500,43,Iqbal Mankada
07-11-2025,B-3408,500,44,Neemuchwala
07-11-2025,B-3501,500,45,Abdullah Amravatiwala
08-11-2025,B-3502,500,76,AbdulMustansir Fazleabbas Rampurwala
19-11-2025,B-3503,500,197,zainab Painter
10-11-2025,B-3504,500,126,Taher Indorewala
09-11-2025,B-3505,500,96,Murtuza Devasli
09-11-2025,B-3506,500,97,Nafisa Devasli
09-11-2025,B-3507,500,98,Yusuf Gallam
10-11-2025,B-3508,500,133,A Ghadiyali
23-11-2025,B-3601,500,208,Salman Bharmal
10-12-2025,B-3602,500,215,Murtaza Lokhandwala
07-11-2025,B-3603,500,46,Saifudeen Bhanpurawala
08-11-2025,B-3604,500,80,khozema Aggarwala
09-11-2025,B-3605,500,106,Samina Husain
08-11-2025,B-3606,500,79,Fatema Merchant
08-11-2025,B-3607,500,77,Shabbir Ladhi
08-11-2025,B-3608,500,78,Rashida Shabbir Ladhi
10-11-2025,B-3701,500,132,Kathawala
20-11-2025,B-3702,500,203,Zainab Dhankot
10-11-2025,B-3703,500,127,Rashida Patanwala
05-07-2026,B-3705,500,957,Shabbir Husain / Nafisa Khokhawala
12-11-2025,B-3707,500,155,Mehjabeen Randhanpurwala
12-11-2025,B-3708,500,149,Hussain Udaipurwala
08-11-2025,B-3801,500,83,Saifuddin Poonawala
08-11-2025,B-3802,500,82,Yusuf Bhai Rangwala
08-11-2025,B-3803,500,84,Sakina Aftab
08-11-2025,B-3804,500,85,Sakina Aftab
08-11-2025,B-3807,500,81,Abdul Tayyab Misri
09-11-2025,B-3808,500,95,Aziz Ratlamwala
`;

  const lines = csvStr.trim().split('\n').slice(1);
  const existingKeys = new Set(state.transactions.map(t => t.date + '_' + t.flatNumber));
  
  let addedCount = 0;
  for (const line of lines) {
    const [dateStr, flatNumber, amount, receiptNo, ownerName] = line.split(',');
    
    // Date is DD-MM-YYYY, convert to YYYY-MM-DD
    const [d, m, y] = dateStr.split('-');
    const isoDate = y + '-' + m + '-' + d;
    
    const key = isoDate + '_' + flatNumber;
    if (!existingKeys.has(key)) {
      const timestamp = new Date(isoDate).getTime();
      
      const newTx = {
        id: 'imported-' + Math.random().toString(36).substring(2, 9),
        receiptNo: Number(receiptNo),
        date: isoDate,
        timestamp,
        flatId: flatNumber,
        flatNumber: flatNumber,
        ownerName: ownerName,
        amount: Number(amount),
        mobile: '', // unknown from CSV
        paymentMode: 'CASH',
        remarks: 'Imported from November 2025 backup'
      };
      state.transactions.push(newTx);
      
      state.financialRecords.push({
        id: 'imported-' + Math.random().toString(36).substring(2, 9),
        type: 'INCOME',
        paymentMode: 'CASH',
        amount: Number(amount),
        date: isoDate,
        category: 'Maintenance',
        description: 'Maintenance - ' + flatNumber + ' (Receipt #' + receiptNo + ')',
        timestamp
      });
      
      addedCount++;
    }
  }

  // Update last receipt no
  const lastReceiptNo = state.transactions.reduce((max, t) => Math.max(max, Number(t.receiptNo) || 0), 0);
  state.lastReceiptNo = lastReceiptNo;

  // Remove undefined fields
  const cleanData = JSON.parse(JSON.stringify(state));
  
  if (addedCount > 0) {
    console.log("Writing " + addedCount + " new transactions to Firestore...");
    await setDoc(docRef, cleanData);
    console.log("Successfully wrote to cloud.");
  } else {
    console.log("No new transactions to add.");
  }
  process.exit(0);
}

run().catch(console.error);
