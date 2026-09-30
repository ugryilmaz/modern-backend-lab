import type {
  OrderCreatedEvent,
  EventEnvelope,
} from '../orders/order.types.js';
import { isEventProcessed, markEventAsProcessed } from '../../lib/redis.js';

export const handleOrderCreated = async (
  event: EventEnvelope<OrderCreatedEvent>,
) => {
  const alreadyProcessed = await isEventProcessed(event.eventId);

  if (alreadyProcessed) {
    console.log('Duplicate event ignored:', event.eventId);
    return;
  }

  console.log('Notification service received:', event);

  await markEventAsProcessed(event.eventId);
};
