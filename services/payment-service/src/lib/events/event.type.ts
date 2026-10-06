export type EventEnvelope<T> = {
  eventId: string;
  type: string;
  version: number;
  occurredAt: string;
  source: string;
  data: T;
};

export type OrderCreatedPayload = {
  orderId: string;
  userId: string;
};
