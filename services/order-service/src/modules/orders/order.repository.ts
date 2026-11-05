import db from '../../db/client.js';
import { eq } from 'drizzle-orm';
import { orderReadModel } from '../../db/schema.js';

const findAll = async () => {
  return db.select().from(orderReadModel);
};

const findById = async (orderId: string) => {
  return db
    .select()
    .from(orderReadModel)
    .where(eq(orderReadModel.orderId, orderId));
};

export default { findAll, findById };
