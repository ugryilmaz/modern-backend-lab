import type { FastifyInstance } from 'fastify';

const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', () => {
    return {
      status: 'ok',
      service: 'notification-service',
    };
  });
};

export default healthRoutes;
