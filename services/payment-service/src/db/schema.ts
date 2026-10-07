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

export const orderReadModel = pgTable('order_read_model', {
  orderId: uuid('order_id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
});
