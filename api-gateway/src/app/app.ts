import Fastify, { type FastifyRequest } from 'fastify';
import proxy from '@fastify/http-proxy';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import healthRoutes from './routes/health.routes.js';
import { env } from '../config/env.js';

export const app = Fastify({
  logger: true,
});

app.register(healthRoutes);

app.register(cookie);

app.register(jwt, {
  secret: env.JWT_SECRET,
});

const authenticate = async (request: FastifyRequest) => {
  await request.jwtVerify();
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
  preHandler: authenticate,
});
