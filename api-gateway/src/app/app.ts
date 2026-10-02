import Fastify, { type FastifyError, type FastifyRequest } from 'fastify';
import proxy from '@fastify/http-proxy';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import healthRoutes from './routes/health.routes.js';
import { env } from '../config/env.js';
import fastifySensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import requireRole from '../hooks/require-role.hook.js';
import authenticate from '../hooks/authenticate.hook.js';

export const app = Fastify({
  logger: true,
});

app.register(rateLimit, {
  max: 3,
  timeWindow: '1 minute',
});

app.register(fastifySensible);

app.register(healthRoutes);

app.register(cookie);

app.register(jwt, {
  secret: env.JWT_SECRET,
});

const authenticateAdmin = async (request: FastifyRequest) => {
  await authenticate(request);
  await requireRole('admin')(request);
};

app.register(proxy, {
  upstream: 'http://localhost:3002',
  prefix: '/orders',
  rewritePrefix: '/orders',
});

app.register(proxy, {
  upstream: 'http://localhost:3004',
  prefix: '/users',
  rewritePrefix: '/users',
  preHandler: authenticateAdmin,
  replyOptions: {
    rewriteRequestHeaders: (request, headers) => ({
      ...headers,
      'x-request-id': request.id,
    }),
  },
});

app.setErrorHandler((error: FastifyError, request, reply) => {
  app.log.error(error);

  return reply.status(error.statusCode ?? 500).send({
    message: error.statusCode ? error.message : 'Internal Server Error',
  });
});
