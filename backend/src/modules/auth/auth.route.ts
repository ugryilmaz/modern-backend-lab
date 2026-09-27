import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from './auth.schema.js';
import { login, register } from './auth.service.js';

const authRoutes = async (app: FastifyInstance) => {
  app.post('/register', async (request, reply) => {
    const result = registerSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: result.error.issues,
      });
    }

    const { name, email, password } = result.data;
    const user = await register(name, email, password);

    return reply.status(201).send(user);
  });

  app.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: result.error.issues,
      });
    }

    const { email, password } = result.data;

    const user = await login(email, password);

    if (!user) {
      throw app.httpErrors.unauthorized('Invalid email or password');
    }

    const accessToken = await reply.jwtSign({
      sub: user.id,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  });
};

export default authRoutes;
