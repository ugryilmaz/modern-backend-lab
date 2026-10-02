import { eq } from 'drizzle-orm';
import db from '../../db/client.js';
import { authUsers } from '../../db/schema.js';

const create = async (email: string, passwordHash: string) => {
  const result = await db
    .insert(authUsers)
    .values({ email, passwordHash })
    .returning();
  return result[0];
};

const findByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.email, email));
  return result[0];
};

export default {
  findByEmail,
  create,
};
