import type { FastifyInstance } from 'fastify';

const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', () => {
    return {
      status: 'ok',
      service: 'order-service',
    };
  });
};

export default healthRoutes;
