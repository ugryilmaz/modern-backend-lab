import { randomUUID } from 'node:crypto';
import { orders, outbox } from '../../db/schema.js';
import db from '../../db/client.js';
import { eq } from 'drizzle-orm';

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

export const confirmOrder = async (orderId: string) => {
  const result = await db
    .update(orders)
    .set({
      status: 'CONFIRMED',
    })
    .where(eq(orders.id, orderId))
    .returning();

  return result[0];
};

export const cancelOrder = async (orderId: string) => {
  const result = await db
    .update(orders)
    .set({
      status: 'CANCELLED',
    })
    .where(eq(orders.id, orderId))
    .returning();

  return result[0];
};
