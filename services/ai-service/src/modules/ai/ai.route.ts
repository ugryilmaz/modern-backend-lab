import type { FastifyInstance } from 'fastify';
import { chatRequestSchema } from './ai.schema.js';
import aiService from './ai.service.js';
import { randomUUID } from 'crypto';

const aiRoutes = (app: FastifyInstance) => {
  app.post('/chat', async (request, reply) => {
    const input = chatRequestSchema.safeParse(request.body);

    if (!input.success) {
      return reply.code(400).send({
        message: 'Geçersiz istek.',
        errors: input.error.issues,
      });
    }

    const conversationId = input.data.conversationId ?? randomUUID();

    try {
      const response = await aiService.chatResponse(
        input.data.message,
        conversationId,
      );
      return { response, conversationId };
    } catch (error) {
      request.log.error({ err: error }, 'AI request failed');

      return reply.code(502).send({
        message: 'AI modelinden yanıt alınamadı.',
      });
    }
  });
};

export default aiRoutes;
