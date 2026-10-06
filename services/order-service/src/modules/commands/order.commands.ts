import { randomUUID } from 'node:crypto';
import { orders, outbox } from '../../db/schema.js';
import db from '../../db/client.js';

interface CreateOrderCommand {
  userId: string;
}

export const createOrder = async ({ userId }: CreateOrderCommand) => {
  const eventId = randomUUID();

  const event = {
    eventId,
    type: 'order.created',
    version: 1,
    occurredAt: new Date().toISOString(),
    source: 'order-service',
    data: {
      userId,
    },
  };

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
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

    return {
      order,
      outboxEvent,
    };
  });

  return result.order;
};
