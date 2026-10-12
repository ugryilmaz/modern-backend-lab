import { randomUUID } from 'node:crypto';
import { orders, outbox } from '../../db/schema.js';
import db from '../../db/client.js';
import { eq, and } from 'drizzle-orm';

interface CreateOrderCommand {
  userId: string;
  idempotencyKey?: string;
}

export const createOrder = async ({
  userId,
  idempotencyKey,
}: CreateOrderCommand) => {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      })
      .onConflictDoNothing({
        target: [orders.userId, orders.idempotencyKey],
      })
      .returning();

    if (!order && idempotencyKey) {
      const [existingOrder] = await tx
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.idempotencyKey, idempotencyKey),
          ),
        )
        .limit(1);

      if (!existingOrder) {
        throw new Error('Existing order could not be found');
      }

      return existingOrder;
    }

    if (!order) {
      throw new Error('Order could not be created');
    }

    const eventId = randomUUID();

    const event = {
      eventId,
      type: 'order.created',
      version: 1,
      occurredAt: new Date().toISOString(),
      source: 'order-service',
      data: {
        userId,
        orderId: order.id,
      },
    };

    await tx.insert(outbox).values({
      eventId,
      eventType: event.type,
      payload: event,
    });

    return order;
  });
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
