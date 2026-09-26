import type { FastifyInstance } from 'fastify';
import userService from './user.service.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
} from './users.schema.js';

const userRoutes = async (app: FastifyInstance) => {
  app.get('/users', async () => {
    return userService.getUsers();
  });

  app.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

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
    return user;
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

    return user;
  });

  app.post('/users', async (request, reply) => {
    const result = createUserSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: result.error.issues,
      });
    }

    const { name, email } = result.data;
    return userService.createUser(name, email);
  });
};

export default userRoutes;
