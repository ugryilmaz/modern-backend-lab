import db from '../db/client.js';
import { orderReadModel } from '../db/schema.js';

interface OrderCreatedEvent {
  eventId: string;
  type: 'order.created';
  version: number;
  occurredAt: string;
  source: string;
  data: {
    orderId: string;
    userId: string;
  };
}

export const handleOrderCreated = async (event: OrderCreatedEvent) => {
  await db
    .insert(orderReadModel)
    .values({
      orderId: event.data.orderId,
      userId: event.data.userId,
    })
    .onConflictDoNothing();
};
