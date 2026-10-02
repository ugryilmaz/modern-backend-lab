import type { FastifyInstance } from 'fastify';
import userService from './user.service.js';
import { updateUserSchema, userIdParamsSchema } from './users.schema.js';

const userRoutes = async (app: FastifyInstance) => {
  app.get('/users', async () => {
    return userService.getUsers();
  });

  app.get('/users/:id', async (request, reply) => {
    const result = userIdParamsSchema.safeParse(request.params);

    if (!result.success) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: result.error.issues,
      });
    }

    const user = await userService.getUserById(result.data.id);

    if (!user) {
      throw app.httpErrors.notFound('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  });

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
