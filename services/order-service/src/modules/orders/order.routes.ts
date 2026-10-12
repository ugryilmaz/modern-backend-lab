import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import db from '../../db/client.js';
import { orders, outbox } from '../../db/schema.js';

import { sql } from 'drizzle-orm';
import { getOrders } from '../queries/order.query.js';
import { createOrder } from '../commands/order.commands.js';
import { z } from 'zod';

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(1, 'Idempotency-Key cannot be empty')
  .max(200, 'Idempotency-Key cannot exceed 200 characters');

const orderRoutes = async (app: FastifyInstance) => {
  /*app.get('/deadlock-test', async () => {
    const rows = await db
      .select({
        id: orders.id,
      })
      .from(orders)
      .limit(2);

    if (rows.length < 2) {
      throw new Error('Deadlock test requires at least 2 orders');
    }

    const [firstId, secondId] = [rows[0].id, rows[1].id].sort();

    const workerA = db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM ${orders} WHERE id = ${firstId} FOR UPDATE`,
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      await tx.execute(
        sql`SELECT id FROM ${orders} WHERE id = ${secondId} FOR UPDATE`,
      );

      return 'Worker A completed';
    });

    const workerB = db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM ${orders} WHERE id = ${firstId} FOR UPDATE`,
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      await tx.execute(
        sql`SELECT id FROM ${orders} WHERE id = ${secondId} FOR UPDATE`,
      );

      return 'Worker B completed';
    });

    return Promise.allSettled([workerA, workerB]);
  });*/

  app.get('/orders', async () => {
    return getOrders();
  });

  app.post('/orders', async (request, reply) => {
    const result = idempotencyKeySchema.safeParse(
      request.headers['idempotency-key'],
    );

    if (!result.success) {
      return reply.code(400).send({
        message: 'Invalid Idempotency-Key header.',
        errors: result.error.issues,
      });
    }

    return createOrder({
      userId: '67890',
      idempotencyKey: result.data,
    });
  });
};

export default orderRoutes;
