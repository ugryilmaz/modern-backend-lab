import Fastify from 'fastify';
import healthRoutes from './routes/health.routes.js';
import orderRoutes from '../modules/orders/order.routes.js';

export const app = Fastify({
  logger: true,
});

app.register(healthRoutes);
app.register(orderRoutes);
