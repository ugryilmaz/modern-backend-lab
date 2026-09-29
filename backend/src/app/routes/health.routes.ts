import type { FastifyInstance } from 'fastify';

const healthRoutes = async (app: FastifyInstance) => {
  app.get(
    '/health',
    {
      config: {
        rateLimit: false,
      },
    },
    () => {
      return {
        status: 'ok',
      };
    },
  );
};

export default healthRoutes;
