import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from './auth.schema.js';
import { login, register } from './auth.service.js';
import type { JwtPayload } from './auth.types.js';
import { randomUUID } from 'node:crypto';
import redis from '../../lib/redis.js';

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

    const refreshJti = randomUUID();
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
        jti: refreshJti,
      },
      {
        expiresIn: '7d',
      },
    );

    await redis.set(`refresh:${refreshJti}`, String(user.id), {
      EX: 60 * 60 * 24 * 7,
    });

    await redis.sAdd(`user:sessions:${user.id}`, refreshJti);

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

    if (!payload.jti) {
      throw app.httpErrors.unauthorized('Invalid refresh token');
    }

    const key = `refresh:${payload.jti}`;

    const userId = await redis.getDel(key);

    if (!userId) {
      throw app.httpErrors.unauthorized('Invalid refresh token');
    }

    if (Number(userId) !== payload.sub) {
      throw app.httpErrors.unauthorized('Invalid refresh token');
    }

    await redis.sRem(`user:sessions:${userId}`, payload.jti);

    const newRefreshJti = randomUUID();

    await redis.sAdd(`user:sessions:${payload.sub}`, newRefreshJti);

    await redis.set(`refresh:${newRefreshJti}`, String(payload.sub), {
      EX: 60 * 60 * 24 * 7,
    });

    const newRefreshToken = await reply.jwtSign(
      {
        sub: payload.sub,
        role: payload.role,
        type: 'refresh',
        jti: newRefreshJti,
      },
      {
        expiresIn: '7d',
      },
    );

    reply.setCookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 60 * 60 * 24 * 7,
    });

    const accessToken = await reply.jwtSign({
      sub: payload.sub,
      role: payload.role,
      type: 'access',
    });

    return {
      accessToken,
    };
  });

  app.post('/logout', async (request, reply) => {
    const { refreshToken } = request.cookies;

    reply.clearCookie('refreshToken', {
      path: '/auth',
    });

    if (!refreshToken) {
      return {
        message: 'Logged out',
      };
    }

    try {
      const payload = app.jwt.verify<JwtPayload>(refreshToken);

      if (payload.type === 'refresh' && payload.jti) {
        await redis.del(`refresh:${payload.jti}`);
        await redis.sRem(`user:sessions:${payload.sub}`, payload.jti);
      }
    } catch (error) {
      app.log.warn({ error }, 'Invalid refresh token during logout');
    }

    return {
      message: 'Logged out',
    };
  });

  app.post('/logout-all', async (request, reply) => {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      reply.clearCookie('refreshToken', {
        path: '/auth',
      });

      return {
        message: 'Logged out',
      };
    }

    const payload = app.jwt.verify<JwtPayload>(refreshToken);

    if (payload.type !== 'refresh' || !payload.jti) {
      throw app.httpErrors.unauthorized('Invalid refresh token');
    }

    const sessionKey = `user:sessions:${payload.sub}`;

    const sessionJtis = await redis.sMembers(sessionKey);

    const refreshKeys = sessionJtis.map((jti) => `refresh:${jti}`);

    if (refreshKeys.length > 0) {
      await redis.del(refreshKeys);
    }

    await redis.del(sessionKey);

    reply.clearCookie('refreshToken', {
      path: '/auth',
    });

    return {
      message: 'Logged out from all sessions',
    };
  });
};

export default authRoutes;
