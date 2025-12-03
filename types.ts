
export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

export interface Flat {
  id: string;
  flatNumber: string;
  ownerName: string; // Placeholder or actual name
  status: PaymentStatus;
  mobile?: string;
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

export interface AppState {
  flats: Flat[];
  transactions: Transaction[];
  lastReceiptNo: number;
  aiInsight?: {
    text: string;
    timestamp: number;
  };
}

export type ViewState = 'DASHBOARD' | 'PAYMENT' | 'REPORTS' | 'UNPAID_LIST' | 'SETTINGS';
