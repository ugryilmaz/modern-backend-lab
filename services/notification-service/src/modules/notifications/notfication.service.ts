import type {
  EventEnvelope,
  OrderCreatedEvent,
} from '../../lib/events/event.type.js';

export const handleOrderCreated = async (
  event: EventEnvelope<OrderCreatedEvent>,
) => {
  console.log('Notification service received:', event);
};
