import type { FastifyInstance, FastifyRequest } from 'fastify';
import type CircuitBreaker from 'opossum';

interface ProfileRouteOptions {
  orderCircuitBreaker: CircuitBreaker;
}

export const profileRoutes = (
  app: FastifyInstance,
  options: ProfileRouteOptions,
) => {
  app.get('/profile', async (request) => {
    const userId = Number(request.headers['x-user-id']);

    /*return {
      userId,
    };*/

    const [usersResponse, orders] = await Promise.all([
      fetch('http://localhost:3004/users'),
      options.orderCircuitBreaker.fire(),
    ]);

    console.log(usersResponse);

    if (!usersResponse.ok) {
      throw new Error('Backend service request failed');
    }

    const users = await usersResponse.json();

    return {
      users,
      orders,
    };
  });
};
