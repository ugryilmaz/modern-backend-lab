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
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastifyEtag } from '@fastify/etag';

export const app = Fastify({
  logger: true,
});

app.register(rateLimit, {
  max: 10,
  timeWindow: '1 minute',
});

/*await app.register(fastifySwagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'API Gateway',
      description: 'Production-Oriented Node.js Backend Architecture Lab',
      version: '1.0.0',
    },
    paths: {
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Get users',
          responses: {
            200: {
              description: 'Users returned successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

await app.register(fastifySwaggerUi, {
  routePrefix: '/documentation',
});*/

await app.register(fastifyEtag);

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
  prefix: '/v1/users',
  rewritePrefix: '/v1/users',
  preHandler: authenticateAdmin,
  replyOptions: {
    rewriteRequestHeaders: (request, headers) => ({
      ...headers,
      'x-request-id': request.id,
    }),
  },
});

app.register(proxy, {
  upstream: 'http://localhost:3004',
  prefix: '/v2/users',
  rewritePrefix: '/v2/users',
  preHandler: authenticateAdmin,
  replyOptions: {
    rewriteRequestHeaders: (request, headers) => ({
      ...headers,
      'x-request-id': request.id,
    }),
  },
});

app.register(proxy, {
  upstream: 'http://localhost:3010',
  prefix: '/profile',
  rewritePrefix: '/profile',
  preHandler: authenticate,
  replyOptions: {
    rewriteRequestHeaders: (request, headers) => ({
      ...headers,
      'x-user-id': String(request.user.sub),
      'x-user-role': request.user.role,
    }),
  },
});

app.setErrorHandler((error: FastifyError, request, reply) => {
  app.log.error(error);

  return reply.status(error.statusCode ?? 500).send({
    message: error.statusCode ? error.message : 'Internal Server Error',
  });
});
