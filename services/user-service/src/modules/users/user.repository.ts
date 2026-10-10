import { eq, inArray } from 'drizzle-orm';
import db from '../../db/client.js';
import { products, users } from '../../db/schema.js';

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

const findByEmail = async (email: string) => {
  const result = await db.select().from(users).where(eq(users.email, email));
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

//Eager loading of products for users
const findAllWithProducts = async () => {
  return db.query.users.findMany({
    with: {
      products: true,
    },
  });
};

const findProductsByUserIds = async (userIds: number[]) => {
  if (userIds.length === 0) {
    return [];
  }

  return db.select().from(products).where(inArray(products.userId, userIds));
};

export default {
  findAll,
  findById,
  findByEmail,
  remove,
  create,
  update,
  findAllWithProducts,
  findProductsByUserIds,
};
