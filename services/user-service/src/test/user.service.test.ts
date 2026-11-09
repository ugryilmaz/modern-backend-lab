import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { redis } from '../lib/redis.js';
import userRepository from '../modules/users/user.repository.js';
import userService from '../modules/users/user.service.js';

const userId = 987654321;

const cacheKey = `cache:user:${userId}`;
const lockKey = `lock:user:${userId}`;

before(async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }

  await redis.del([cacheKey, lockKey]);
});

after(async () => {
  await redis.del([cacheKey, lockKey]);

  if (redis.isOpen) {
    await redis.quit();
  }
});

test('100 eşzamanlı kullanıcı isteği geldiğinde yalnızca bir DB sorgusu çalışmalı', async () => {
  let dbQueryCount = 0;

  const originalFindById = userRepository.findById;

  userRepository.findById = async (id) => {
    dbQueryCount++;

    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      id,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };
  };

  try {
    const results = await Promise.all(
      Array.from({ length: 100 }, () => userService.getUserById(userId)),
    );

    assert.equal(dbQueryCount, 1);

    assert.equal(results.length, 100);

    assert.ok(results.every((user) => user?.id === userId));

    assert.equal(await redis.exists(lockKey), 0);

    console.log('DB query count:', dbQueryCount);
    console.log('Successful responses:', results.length);
  } finally {
    userRepository.findById = originalFindById;

    await redis.del([cacheKey, lockKey]);
  }
});
