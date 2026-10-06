import db from '../../db/client.js';
import { orderReadModel, orders } from '../../db/schema.js';

const findAll = async () => {
  return db.select().from(orderReadModel);
};

export default { findAll };
