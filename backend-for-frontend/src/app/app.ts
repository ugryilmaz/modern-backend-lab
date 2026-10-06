import Fastify from 'fastify';
import healthRoutes from './routes/health.routes.js';
import { profileRoutes } from '../modules/profile.route.js';
import { createOrderCircuitBreaker } from '../circuit-breakers/order-circuit-breakers.js';
import { createOrderBulkhead } from '../bulkheads/order.bulkhead.js';

export const app = Fastify({
  logger: true,
});

const orderCircuitBreaker = createOrderCircuitBreaker(app.log);
const orderBulkhead = createOrderBulkhead();

app.register(healthRoutes);
app.register(profileRoutes, { orderCircuitBreaker, orderBulkhead });
