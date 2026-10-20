import type { FastifyInstance } from 'fastify';
import aiService from './chat.service.js';
import { randomUUID } from 'crypto';
import { authenticate } from '@modern-backend-lab/shared';
import { chatRequestSchema } from './chat.schema.js';

const chatRoutes = (app: FastifyInstance) => {
  app.post('/chat', { preHandler: authenticate }, async (request, reply) => {
    const input = chatRequestSchema.safeParse(request.body);

    if (!input.success) {
      return reply.code(400).send({
        message: 'Geçersiz istek.',
        errors: input.error.issues,
      });
    }

    const conversationId = input.data.conversationId ?? randomUUID();

    try {
      const response = await aiService.chat(
        input.data.message,
        conversationId,
        request.user.sub,
        request.signal,
      );
      return { response, conversationId };
    } catch (error) {
      if (request.signal.aborted) {
        request.log.info(
          { reason: request.signal.reason },
          'AI request aborted',
        );

        return;
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        request.log.warn({ err: error }, 'AI request timed out');

        return reply.code(504).send({
          message: 'AI isteği zaman aşımına uğradı. Lütfen tekrar deneyin.',
        });
      }

      request.log.error({ err: error }, 'AI request failed');

      return reply.code(502).send({
        message: 'AI modelinden yanıt alınamadı.',
      });
    }
  });
};

export default chatRoutes;
