import type { FastifyInstance, FastifyRequest } from 'fastify';

export const profileRoutes = (app: FastifyInstance) => {
  app.get('/profile', async (request) => {
    const userId = Number(request.headers['x-user-id']);

    return {
      userId,
    };

    const [usersResponse, ordersResponse] = await Promise.all([
      fetch('http://localhost:3004/users'),
      fetch('http://localhost:3002/orders'),
    ]);

    console.log(usersResponse);

    if (!usersResponse.ok || !ordersResponse.ok) {
      throw new Error('Backend service request failed');
    }

    const [users, orders] = await Promise.all([
      usersResponse.json(),
      ordersResponse.json(),
    ]);
    return {
      users,
      orders,
    };
  });
};
