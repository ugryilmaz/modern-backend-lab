import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import userRoutes from '../modules/users/user.routes.js';

export const app = Fastify({
  logger: true,
});

app.register(userRoutes);
app.register(sensible);
