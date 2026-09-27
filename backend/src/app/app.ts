import Fastify, { type FastifyError } from 'fastify';
import healthRoutes from './routes/health.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import fastifySensible from '@fastify/sensible';
import authRoutes from '../modules/auth/auth.route.js';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

const app = Fastify({
  logger: true,
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

app.register(healthRoutes);
app.register(userRoutes);
app.register(authRoutes, { prefix: '/auth' });
app.register(fastifySensible);

app.setErrorHandler((error: FastifyError, request, reply) => {
  app.log.error(error);

  const cause = error.cause as
    | {
        code?: string;
      }
    | undefined;

  if (cause?.code === '23505') {
    return reply.status(409).send({
      message: 'Email already exists',
    });
  }

  return reply.status(error.statusCode ?? 500).send({
    message: error.statusCode ? error.message : 'Internal Server Error',
  });
});

export default app;
