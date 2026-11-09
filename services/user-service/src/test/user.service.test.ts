import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';

import { redis } from '../lib/redis.js';
import { client, dbQueryCounter } from '../db/client.js';
import userRepository from '../modules/users/user.repository.js';
import userService from '../modules/users/user.service.js';

before(async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
});

after(async () => {
  if (redis.isOpen) {
    await redis.quit();
  }

  await client.end();
});

test('100 eşzamanlı kullanıcı isteği geldiğinde yalnızca bir DB sorgusu çalışmalı', async () => {
  const createdUser = await userRepository.create(
    'Query Count Test User',
    `query-count-${randomUUID()}@example.com`,
  );

  if (!createdUser) {
    throw new Error('Test kullanıcısı oluşturulamadı');
  }

  const cacheKey = `cache:user:${createdUser.id}`;
  const lockKey = `lock:user:${createdUser.id}`;

  try {
    await redis.del([cacheKey, lockKey]);

    dbQueryCounter.count = 0;

    const results = await Promise.all(
      Array.from({ length: 100 }, () =>
        userService.getUserById(createdUser.id),
      ),
    );

    const actualSqlQueryCount = dbQueryCounter.count;

    assert.equal(actualSqlQueryCount, 1);

    assert.equal(results.length, 100);

    assert.ok(results.every((user) => user?.id === createdUser.id));

    assert.equal(await redis.exists(lockKey), 0);
  } finally {
    await redis.del([cacheKey, lockKey]);
    await userRepository.remove(createdUser.id);
  }
});

test('eski fencing token ile gelen update reddedilmeli', async () => {
  const createdUser = await userRepository.create(
    'Fencing Test User',
    `fencing-${randomUUID()}@example.com`,
  );

  if (!createdUser) {
    throw new Error('Test kullanıcısı oluşturulamadı');
  }

  const fencingKey = `fencing:user:update:${createdUser.id}`;
  const lockKey = `lock:user:update:${createdUser.id}`;
  const cacheKey = `cache:user:${createdUser.id}`;

  try {
    const firstUpdate = await userService.updateUser(createdUser.id, {
      name: 'Instance A',
    });

    assert.ok(firstUpdate);

    const secondUpdate = await userService.updateUser(createdUser.id, {
      name: 'Instance B',
    });

    assert.ok(secondUpdate);

    assert.ok(secondUpdate.lastFencingToken > firstUpdate.lastFencingToken);

    const staleUpdate = await userRepository.update(
      createdUser.id,
      { name: 'Stale Instance A' },
      firstUpdate.lastFencingToken,
    );

    assert.equal(staleUpdate, undefined);

    const currentUser = await userRepository.findById(createdUser.id);

    assert.equal(currentUser?.name, 'Instance B');

    assert.equal(currentUser?.lastFencingToken, secondUpdate.lastFencingToken);
  } finally {
    await redis.del([cacheKey, lockKey]);
    await userRepository.remove(createdUser.id);

    await redis.del(fencingKey);
  }
});
