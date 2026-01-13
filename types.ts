
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
  receiptNo: number;
  date: string; // ISO String
  timestamp: number;
  flatId: string;
  flatNumber: string;
  ownerName: string;
  amount: number;
  mobile: string;
}

export interface FinancialRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  paymentMode: 'CASH' | 'BANK';
  amount: number;
  date: string; // ISO String YYYY-MM-DD
  category: string;
  description: string;
  timestamp: number;
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
  lastReceiptNo: number;
  theme?: 'LIGHT' | 'DARK'; // Added Theme
  aiInsight?: {
    text: string;
    timestamp: number;
  };
}

export type ViewState = 'DASHBOARD' | 'PAYMENT' | 'FLATS' | 'ACCOUNTS' | 'REPORTS' | 'UNPAID_LIST' | 'SETTINGS' | 'HALL_BOOKING';
