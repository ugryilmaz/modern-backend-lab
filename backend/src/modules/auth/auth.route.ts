import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from './auth.schema.js';
import { login, register } from './auth.service.js';
import type { JwtPayload } from './auth.types.js';

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
      type: 'access',
    });

    const refreshToken = await reply.jwtSign(
      {
        sub: user.id,
        role: user.role,
        type: 'refresh',
      },
      {
        expiresIn: '7d',
      },
    );

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      accessToken,
      user,
    };
  });

  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      throw app.httpErrors.unauthorized('Refresh token not found');
    }

    const payload = app.jwt.verify<JwtPayload>(refreshToken);

    if (payload.type !== 'refresh') {
      throw app.httpErrors.unauthorized('Invalid refresh token');
    }

    const accessToken = await reply.jwtSign({
      sub: payload.sub,
      role: payload.role,
      type: 'access',
    });

    return {
      accessToken,
    };
  });
};

export default authRoutes;
