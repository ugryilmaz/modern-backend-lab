import 'dotenv/config';
import db from './client.js';
import { users } from './schema.js';

const testConnection = async () => {
  const result = await db.select().from(users);

  console.log(result);
};

testConnection();
