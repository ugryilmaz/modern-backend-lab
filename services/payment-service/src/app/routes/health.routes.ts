import type { FastifyInstance } from 'fastify';

const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', () => {
    return {
      status: 'ok',
      service: 'payment-service',
    };
  });
};

export default healthRoutes;
