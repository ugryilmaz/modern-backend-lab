import type { FastifyInstance } from 'fastify';
import userService from './user.service.js';
import { updateUserSchema, userIdParamsSchema } from './users.schema.js';
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';

const userRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/v1/users', async () => {
    return userService.getUsers();
  });

  app.get('/v2/users', async () => {
    return {
      users: await userService.getUsersWithProductsBatch(),
      message: 'This is version 2 of the users API',
    };
  });

  app.get(
    '/users/:id',
    {
      schema: {
        params: userIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const user = await userService.getUserById(id);

      if (!user) {
        throw app.httpErrors.notFound('User not found');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      };
    },
  );

  app.patch('/users/:id', async (request, reply) => {
    const paramsResult = userIdParamsSchema.safeParse(request.params);

    if (!paramsResult.success) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: paramsResult.error.issues,
      });
    }

    const result = updateUserSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: result.error.issues,
      });
    }

    const user = await userService.updateUser(
      paramsResult.data.id,
      result.data,
    );

    if (!user) {
      throw app.httpErrors.notFound('User not found');
    }

    return user;
  });

  app.delete('/users/:id', async (request, reply) => {
    const paramsResult = userIdParamsSchema.safeParse(request.params);

    if (!paramsResult.success) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: paramsResult.error.issues,
      });
    }

    const user = await userService.deleteUser(paramsResult.data.id);

    if (!user) {
      throw app.httpErrors.notFound('User not found');
    }

    return reply.code(204).send();
  });
};

export default userRoutes;
