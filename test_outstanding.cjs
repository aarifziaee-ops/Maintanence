const state = {
  flats: [
    { id: '1', flatNumber: '2404', isRented: false }
  ],
  transactions: [
    // Suppose they paid for earlier months, but missing April, May, June
    { flatId: '1', amount: 2000, date: '2026-01-10', remarks: 'Jan' },
    { flatId: '1', amount: 2000, date: '2026-02-10', remarks: 'Feb' },
    { flatId: '1', amount: 2000, date: '2026-03-10', remarks: 'March' }
  ]
};

// We need to run getOutstandingBreakdown with this state
