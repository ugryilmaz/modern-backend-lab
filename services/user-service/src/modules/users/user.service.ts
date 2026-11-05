import { randomUUID } from 'node:crypto';
import { redis } from '../../lib/redis.js';
import userRepository from './user.repository.js';
import pRetry from 'p-retry';

const getUsers = async () => {
  const users = await userRepository.findAll();

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }));
};

const getUsersWithProducts = async () => {
  return userRepository.findAllWithProducts();
};

const getUsersWithProductsBatch = async () => {
  const users = await userRepository.findAll();

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((user) => user.id);

  const products = await userRepository.findProductsByUserIds(userIds);

  const productsByUserId = new Map<number, typeof products>();

  for (const product of products) {
    const userProducts = productsByUserId.get(product.userId);

    if (userProducts) {
      userProducts.push(product);
    } else {
      productsByUserId.set(product.userId, [product]);
    }
  }

  return users.map((user) => ({
    ...user,
    products: productsByUserId.get(user.id) ?? [],
  }));
};

const createUser = async (name: string, email: string) => {
  return userRepository.create(name, email);
};

const lockScript = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end

  return 0
`;

const getUserById = async (id: number) => {
  const cacheKey = `cache:user:${id}`;
  const lockKey = `lock:user:${id}`;

  return pRetry(
    async () => {
      const cachedUser = await redis.get(cacheKey);

      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      const token = randomUUID();

      const lockAcquired = await redis.set(lockKey, token, {
        NX: true,
        PX: 10_000,
      });

      if (lockAcquired !== 'OK') {
        throw new Error('Lock not acquired');
      }

      try {
        const cachedUserAfterLock = await redis.get(cacheKey);

        if (cachedUserAfterLock) {
          return JSON.parse(cachedUserAfterLock);
        }

        const user = await userRepository.findById(id);

        if (!user) {
          return null;
        }

        await redis.set(cacheKey, JSON.stringify(user), {
          EX: 60 * 5,
        });

        return user;
      } finally {
        await redis.eval(lockScript, {
          keys: [lockKey],
          arguments: [token],
        });
      }
    },
    {
      retries: 5,
      minTimeout: 20,
      maxTimeout: 100,
      factor: 2,
      randomize: true,
      maxRetryTime: 5_000,
      shouldRetry: ({ error }) => error.message === 'Lock not acquired',
    },
  );
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

  /* await publishMessage('user.updated', JSON.stringify(event)); */

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
  getUsersWithProducts,
  getUsersWithProductsBatch,
};
