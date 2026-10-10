import type { FastifyInstance } from 'fastify';
import { chatRequestSchema } from './ai.schema.js';
import aiService from './ai.service.js';

const aiRoutes = (app: FastifyInstance) => {
  app.post('/chat', async (request, reply) => {
    const input = chatRequestSchema.safeParse(request.body);

    if (!input.success) {
      return reply.code(400).send({
        message: 'Geçersiz istek.',
        errors: input.error.issues,
      });
    }

    try {
      const response = await aiService.chatResponse(input.data.message);
      return { response };
    } catch (error) {
      request.log.error({ err: error }, 'AI request failed');

      return reply.code(502).send({
        message: 'AI modelinden yanıt alınamadı.',
      });
    }
  });
};

export default aiRoutes;
