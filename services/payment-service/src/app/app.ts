import Fastify from 'fastify';
import healthRoutes from './routes/health.routes.js';
import { paymentRoutes } from '../modules/payments/payment.route.js';

export const app = Fastify({
  logger: true,
});

app.register(healthRoutes);
app.register(paymentRoutes);
