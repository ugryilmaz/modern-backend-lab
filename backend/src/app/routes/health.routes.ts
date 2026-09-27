import type { FastifyInstance } from 'fastify';

const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', () => {
    return {
      status: 'ok',
    };
  });
};

export default healthRoutes;
