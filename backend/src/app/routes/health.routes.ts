import type { FastifyInstance } from 'fastify';

const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', (async) => {
    return {
      status: 'ok',
    };
  });
};

export default healthRoutes;
