import { eq } from 'drizzle-orm';
import db from '../../db/client.js';
import { users } from '../../db/schema.js';

const findAll = async () => {
  return db.select().from(users);
};

const create = async (name: string, email: string) => {
  const result = await db.insert(users).values({ name, email }).returning();
  return result[0];
};

const findById = async (id: number) => {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
};

const update = async (id: number, data: { name?: string; email?: string }) => {
  const result = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return result[0];
};

const remove = async (id: number) => {
  const result = await db.delete(users).where(eq(users.id, id)).returning();

  return result[0];
};

export default {
  findAll,
  findById,
  remove,
  create,
  update,
};
