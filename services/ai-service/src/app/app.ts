import Fastify from 'fastify';
import aiRoutes from '../modules/ai/ai.route.js';

export const app = Fastify({
  logger: true,
});

app.register(aiRoutes);
