import { randomUUID } from 'node:crypto';
import { publishMessage, redis } from '../../lib/redis.js';
import userRepository from './user.repository.js';

const getUsers = async () => {
  const users = await userRepository.findAll();

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }));
};

const createUser = async (
  name: string,
  email: string,
  passwordHash: string,
) => {
  return userRepository.create(name, email, passwordHash);
};

const getUserById = async (id: number) => {
  const cacheKey = `cache:user:${id}`;

  const cachedUser = await redis.get(cacheKey);

  if (cachedUser) {
    return JSON.parse(cachedUser);
  }

  const user = await userRepository.findById(id);

  if (!user) {
    return null;
  }

  await redis.set(cacheKey, JSON.stringify(user), {
    EX: 60 * 5,
  });

  return user;
};

const updateUser = async (
  id: number,
  data: {
    name?: string;
    email?: string;
  },
) => {
  const user = await userRepository.update(id, data);

  if (!user) {
    return null;
  }

  await redis.del(`cache:user:${id}`);

  const event = {
    eventId: randomUUID(),
    type: 'user.updated',
    occurredAt: new Date().toISOString(),
    payload: {
      userId: user.id,
    },
  };

  await publishMessage('user.updated', JSON.stringify(event));

  return user;
};

const deleteUser = async (id: number) => {
  const user = await userRepository.remove(id);

  if (!user) {
    return null;
  }

  await redis.del(`cache:user:${id}`);

  return user;
};

export default {
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  createUser,
};
