
export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

export interface Flat {
  id: string;
  flatNumber: string;
  ownerName: string; 
  status: PaymentStatus;
  mobile?: string;
  
  // Extended Master Fields
  isRented?: boolean;
  tenantName?: string;
  tenantMobile?: string;
  
  vehicle2WCount?: number;
  vehicle4WCount?: number;
  vehicle2WNumbers?: string; // Comma separated
  vehicle4WNumbers?: string; // Comma separated
}

export interface Transaction {
  id: string; // for tx
  receiptNo: number;
  date: string; // ISO String
  timestamp: number;
  flatId: string;
  flatNumber: string;
  ownerName: string;
  amount: number;
  mobile: string;
  paymentMode?: 'CASH' | 'BANK';
  remarks?: string;
}

export interface Vendor {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  contactPerson?: string;
  category: string; // e.g., 'Security', 'Cleaning', 'Plumbing'
  paymentType: 'MONTHLY' | 'PER_WORK';
  defaultAmount: number;
  openingBalance: number; // Amount owed to vendor at the start
  createdAt: string;
}

export interface FinancialRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'VENDOR_BILL';
  paymentMode: 'CASH' | 'BANK';
  amount: number;
  date: string; // ISO String YYYY-MM-DD
  category: string;
  description: string;
  timestamp: number;
  vendorId?: string; // Link to Vendor
}

export interface HallBooking {
  id: string;
  flatId: string;
  flatNumber: string;
  ownerName: string;
  mobile: string;
  hallType: 'BIG' | 'SMALL';
  bookingDate: string; // YYYY-MM-DD
  amount: number;
  timestamp: number;
}

export interface AppState {
  flats: Flat[];
  transactions: Transaction[];
  financialRecords: FinancialRecord[];
  hallBookings: HallBooking[];
  vendors: Vendor[];
  lastReceiptNo: number;
  lastUpdated?: number;
  theme?: 'LIGHT' | 'DARK';
  aiInsight?: {
    text: string;
    timestamp: number;
  };
  outstandingBalances?: { id: number, flatId: string, month: string, amount: number }[];
}

export type ViewState = 'DASHBOARD' | 'PAYMENT' | 'FLATS' | 'ACCOUNTS' | 'REPORTS' | 'UNPAID_LIST' | 'SETTINGS' | 'HALL_BOOKING' | 'VENDORS';
