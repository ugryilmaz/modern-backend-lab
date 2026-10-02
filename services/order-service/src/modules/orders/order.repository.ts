import db from '../../db/client.js';
import { orders } from '../../db/schema.js';

const findAll = async () => {
  return db.select().from(orders);
};

export default { findAll };
