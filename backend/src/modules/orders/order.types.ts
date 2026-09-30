export type OrderCreatedEvent = {
  orderId: string;
  userId: string;
};

export type EventEnvelope<T> = {
  eventId: string;
  type: string;
  version: number;
  occurredAt: string;
  source: string;
  data: T;
};
