import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import db from '../../db/client.js';
import { payments } from '../../db/schema.js';

export const paymentRoutes = async (app: FastifyInstance) => {
  app.post(
    '/payments',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { orderId } = request.body as { orderId: string };

      const result = await db
        .insert(payments)
        .values({
          orderId,
          status: 'PENDING',
        })
        .returning();

      return result[0];
    },
  );
};
