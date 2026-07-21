import { boolean, integer, pgTable, serial, text, timestamp, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const flats = pgTable('flats', {
  id: text('id').primaryKey(),
  flatNumber: text('flat_number').notNull(),
  ownerName: text('owner_name').notNull(),
  status: text('status').notNull(), // PAID or UNPAID
  mobile: text('mobile'),
  isRented: boolean('is_rented'),
  tenantName: text('tenant_name'),
  tenantMobile: text('tenant_mobile'),
  vehicle2WCount: integer('vehicle_2w_count'),
  vehicle4WCount: integer('vehicle_4w_count'),
  vehicle2WNumbers: text('vehicle_2w_numbers'),
  vehicle4WNumbers: text('vehicle_4w_numbers'),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(), // Not used natively in the app, but good for DB
  receiptNo: integer('receipt_no').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  timestamp: real('timestamp').notNull(),
  flatId: text('flat_id').notNull(),
  flatNumber: text('flat_number').notNull(),
  ownerName: text('owner_name').notNull(),
  amount: real('amount').notNull(),
  mobile: text('mobile'),
  paymentMode: text('payment_mode'),
  remarks: text('remarks'),
});

export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mobile: text('mobile'),
  email: text('email'),
  contactPerson: text('contact_person'),
  category: text('category').notNull(),
  paymentType: text('payment_type').notNull(),
  defaultAmount: real('default_amount').notNull(),
  openingBalance: real('opening_balance').notNull(),
  createdAt: text('created_at').notNull(),
});

export const financialRecords = pgTable('financial_records', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  paymentMode: text('payment_mode').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  timestamp: real('timestamp').notNull(),
  vendorId: text('vendor_id'),
});

export const hallBookings = pgTable('hall_bookings', {
  id: text('id').primaryKey(),
  flatId: text('flat_id').notNull(),
  flatNumber: text('flat_number').notNull(),
  ownerName: text('owner_name').notNull(),
  mobile: text('mobile').notNull(),
  hallType: text('hall_type').notNull(),
  bookingDate: text('booking_date').notNull(),
  amount: real('amount').notNull(),
  timestamp: real('timestamp').notNull(),
});

export const outstandingBalances = pgTable('outstanding_balances', {
  id: serial('id').primaryKey(),
  flatId: text('flat_id').notNull(),
  month: text('month').notNull(), // YYYY-MM format
  amount: real('amount').notNull(),
});

export const appStateMetadata = pgTable('app_state_metadata', {
  id: integer('id').primaryKey().default(1),
  lastReceiptNo: integer('last_receipt_no').notNull().default(0),
  lastUpdated: real('last_updated'),
});
