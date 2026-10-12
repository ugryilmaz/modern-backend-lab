import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
]);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    status: orderStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 200 }),
  },
  (table) => [
    uniqueIndex('orders_user_id_idempotency_key_unique').on(
      table.userId,
      table.idempotencyKey,
    ),
  ],
);

export const outbox = pgTable('outbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().unique(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
});

export const orderReadModel = pgTable('order_read_model', {
  orderId: uuid('order_id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
});
