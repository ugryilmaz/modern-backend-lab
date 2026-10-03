import Fastify from 'fastify';
import healthRoutes from './routes/health.routes.js';
import { profileRoutes } from '../modules/profile.route.js';

export const app = Fastify({
  logger: true,
});

app.register(healthRoutes);
app.register(profileRoutes);
