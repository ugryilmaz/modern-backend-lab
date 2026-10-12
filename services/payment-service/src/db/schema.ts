import { pgEnum, pgTable, uuid, timestamp, varchar } from 'drizzle-orm/pg-core';

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PAID',
  'FAILED',
]);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().unique(),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentIdempotencyKeys = pgTable('payment_idempotency_keys', {
  key: varchar('key', { length: 255 }).primaryKey(),
  requestHash: varchar('request_hash', { length: 64 }).notNull(),
  paymentId: uuid('payment_id').references(() => payments.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderReadModel = pgTable('order_read_model', {
  orderId: uuid('order_id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
});
