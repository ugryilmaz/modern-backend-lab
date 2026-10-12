import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createPayment } from './payment.service.js';

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

const idempotencyKeySchema = z.string().trim().min(1).max(255);

export const paymentRoutes = async (app: FastifyInstance) => {
  app.post(
    '/payments',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const bodyResult = createPaymentSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.code(400).send({
          error: 'Invalid payment request',
          details: bodyResult.error.issues,
        });
      }

      const keyResult = idempotencyKeySchema.safeParse(
        request.headers['idempotency-key'],
      );
      if (!keyResult.success) {
        return reply.code(400).send({
          error: 'A valid Idempotency-Key header is required',
        });
      }

      const result = await createPayment({
        orderId: bodyResult.data.orderId,
        idempotencyKey: keyResult.data,
      });

      if (result.kind === 'key_conflict') {
        return reply.code(409).send({
          error: 'Idempotency-Key was already used with a different request',
        });
      }

      return reply
        .code(201)
        .header('Idempotency-Replayed', String(result.replayed))
        .send(result.payment);
    },
  );
};
