import express from 'express';
import 'dotenv/config';
import path from 'path';
import { db } from './src/db/index.ts';
import { flats, transactions, financialRecords, hallBookings, vendors, appStateMetadata, outstandingBalances } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Helper to fetch all state
app.get('/api/state', async (req, res) => {
  try {
    const allFlats = await db.select().from(flats);
    const allTransactions = await db.select().from(transactions);
    allTransactions.sort((a: any, b: any) => b.receiptNo - a.receiptNo);
    const allFinancialRecords = await db.select().from(financialRecords);
    const allHallBookings = await db.select().from(hallBookings);
    const allVendors = await db.select().from(vendors);
    const allOutstanding = await db.select().from(outstandingBalances);
    const metadataResult = await db.select().from(appStateMetadata).limit(1);
    
    let lastReceiptNo = 0;
    let lastUpdated = Date.now();
    
    if (metadataResult.length > 0) {
      lastReceiptNo = metadataResult[0].lastReceiptNo;
      lastUpdated = metadataResult[0].lastUpdated || Date.now();
    }
    
    res.json({
      flats: allFlats,
      transactions: allTransactions,
      financialRecords: allFinancialRecords,
      hallBookings: allHallBookings,
      vendors: allVendors,
      outstandingBalances: allOutstanding,
      lastReceiptNo,
      lastUpdated,
      theme: 'DARK',
    });
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

// Endpoint for outstanding balances
app.get('/api/outstanding-balances/:flatId', async (req, res) => {
    try {
        const { flatId } = req.params;
        const balances = await db.select().from(outstandingBalances).where(eq(outstandingBalances.flatId, flatId));
        balances.sort((a: any, b: any) => a.month.localeCompare(b.month));
        res.json(balances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch outstanding balances' });
    }
});

app.post('/api/clear-outstanding', async (req, res) => {
    try {
        await db.delete(outstandingBalances).execute();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear outstanding balances' });
    }
});

app.post('/api/delete-outstanding', async (req, res) => {
    try {
        const { ids } = req.body;
        if (Array.isArray(ids) && ids.length > 0) {
            await db.transaction(async (tx: any) => {
                for (const id of ids) {
                    await tx.delete(outstandingBalances).where(eq(outstandingBalances.id, id));
                }
            });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete outstanding balances:', error);
        res.status(500).json({ error: 'Failed to delete outstanding balances' });
    }
});

app.post('/api/outstanding-balances', async (req, res) => {
    try {
        const { balances } = req.body;
        await db.transaction(async (tx: any) => {
            for (const b of balances) {
                await tx.insert(outstandingBalances).values(b);
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save outstanding balances' });
    }
});

app.post('/api/save', async (req, res) => {
  try {
    const state = req.body;
    
    await db.transaction(async (tx: any) => {
      // Clear existing tables
      await tx.delete(transactions);
      await tx.delete(financialRecords);
      await tx.delete(hallBookings);
      await tx.delete(vendors);
      await tx.delete(flats);
      await tx.delete(appStateMetadata);
      
      // Insert new data
      if (state.flats && state.flats.length > 0) {
        await tx.insert(flats).values(state.flats);
      }
      
      if (state.transactions && state.transactions.length > 0) {
        // Exclude 'id' from transactions as it's serial, unless we want to keep them. 
        // Wait, 'id' is in the state but the state might have string ids for some reason?
        // Let's strip 'id' from transactions just in case.
        const cleanTxs = state.transactions.map((t: any) => {
          const { id, ...rest } = t;
          return {
            ...rest,
            amount: Number(rest.amount) || 0,
            timestamp: Number(rest.timestamp) || 0,
            receiptNo: Number(rest.receiptNo) || 0
          };
        });
        await tx.insert(transactions).values(cleanTxs);
      }
      
      if (state.financialRecords && state.financialRecords.length > 0) {
        const cleanFRs = state.financialRecords.map((t: any) => ({
          ...t,
          amount: Number(t.amount) || 0,
          timestamp: Number(t.timestamp) || 0
        }));
        await tx.insert(financialRecords).values(cleanFRs);
      }
      
      if (state.hallBookings && state.hallBookings.length > 0) {
        const cleanHBs = state.hallBookings.map((t: any) => ({
          ...t,
          amount: Number(t.amount) || 0,
          timestamp: Number(t.timestamp) || 0
        }));
        await tx.insert(hallBookings).values(cleanHBs);
      }
      
      if (state.vendors && state.vendors.length > 0) {
        const cleanVendors = state.vendors.map((t: any) => ({
          ...t,
          defaultAmount: Number(t.defaultAmount) || 0,
          openingBalance: Number(t.openingBalance) || 0
        }));
        await tx.insert(vendors).values(cleanVendors);
      }
      
      await tx.insert(appStateMetadata).values([{
        id: 1,
        lastReceiptNo: state.lastReceiptNo || 0,
        lastUpdated: Date.now()
      }]);
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving state:', error);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  
  app.post('/api/log-error', express.json(), (req, res) => {
    console.log("CLIENT ERROR:", req.body);
    
    res.send('ok');
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
