import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifySensible from '@fastify/sensible';

import { env } from '../config/env.js';
import chatRoutes from '../modules/chat/chat.route.js';

export const app = Fastify({
  logger: true,
});

app.register(fastifySensible);

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

app.register(chatRoutes);
