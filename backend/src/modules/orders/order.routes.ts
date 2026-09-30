import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { publishEvent } from '../../lib/rabbitmq.js';

export const orderRoutes = (app: FastifyInstance) => {
  app.get('/orders', async (request, reply) => {
    const order = {
      orderId: randomUUID(),
      userId: '67890',
    };

    await publishEvent('order.created', order);

    return order;
  });
};
