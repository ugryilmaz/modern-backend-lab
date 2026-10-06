import type { FastifyInstance, FastifyRequest } from 'fastify';
import type CircuitBreaker from 'opossum';
import type { createOrderBulkhead } from '../bulkheads/order.bulkhead.js';
import type { LimitFunction } from 'p-limit';

interface ProfileRouteOptions {
  orderCircuitBreaker: CircuitBreaker;
  orderBulkhead: LimitFunction;
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
      options.orderBulkhead(() => options.orderCircuitBreaker.fire()),
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
