import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { publishOutboxEvent } from '../../lib/rabbitmq.js';
import db from '../../db/client.js';
import { orders, outbox } from '../../db/schema.js';

const orderRoutes = async (app: FastifyInstance) => {
  app.post('/orders', async () => {
    const eventId = randomUUID();

    const event = {
      eventId,
      type: 'order.created',
      version: 1,
      occurredAt: new Date().toISOString(),
      source: 'order-service',
      data: {
        userId: '67890',
      },
    };

    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          userId: event.data.userId,
        })
        .returning();

      const [outboxEvent] = await tx
        .insert(outbox)
        .values({
          eventId,
          eventType: event.type,
          payload: {
            ...event,
            data: {
              ...event.data,
              orderId: order.id,
            },
          },
        })
        .returning();

      return { order, outboxEvent };
    });

    return result.order;
  });
};

export default orderRoutes;
