import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { publishEvent } from '../../lib/rabbitmq.js';
import db from '../../db/client.js';
import { orders } from '../../db/schema.js';

const orderRoutes = async (app: FastifyInstance) => {
  app.post('/orders', async () => {
    const [order] = await db
      .insert(orders)
      .values({
        id: randomUUID(),
        userId: '67890',
      })
      .returning();

    await publishEvent('order.created', {
      orderId: order.id,
      userId: order.userId,
    });

    return order;
  });
};

export default orderRoutes;
