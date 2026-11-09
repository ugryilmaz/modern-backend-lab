import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../config/env.js';
import * as schema from './schema.js';
import { DefaultLogger } from 'drizzle-orm';

export const client = postgres(env.DATABASE_URL);

export const dbQueryCounter = {
  count: 0,
};

const defaultLogger = new DefaultLogger();

const db = drizzle(client, {
  schema,
  logger: {
    logQuery: (query, params) => {
      dbQueryCounter.count++;
      defaultLogger.logQuery(query, params);
    },
  },
});

export default db;
