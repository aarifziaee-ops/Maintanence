import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let dbInstance: any = null;

export const getDb = () => {
  if (!dbInstance) {
    if (!pool) {
      pool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        connectionTimeoutMillis: 15000,
      });

      pool.on('error', (err) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
    }
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
};

export const db: any = new Proxy({}, {
  get: (target, prop, receiver) => {
    return Reflect.get(getDb(), prop, receiver);
  }
});
