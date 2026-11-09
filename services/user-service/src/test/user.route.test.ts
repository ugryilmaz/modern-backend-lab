import assert from 'node:assert/strict';
import test from 'node:test';

import { app } from '../app/app.js';
import userService from '../modules/users/user.service.js';

test('GET /v1/users kullanıcı listesini 200 ile döndürmeli', async (t) => {
  const users = [
    {
      id: 1001,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date('2026-11-07T00:00:00.000Z'),
    },
  ];

  const getUsersMock = t.mock.method(
    userService,
    'getUsers',
    async () => users,
  );

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: 'GET',
    url: '/v1/users',
  });

  assert.equal(response.statusCode, 200);

  assert.deepEqual(response.json(), [
    {
      id: 1001,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: '2026-11-07T00:00:00.000Z',
    },
  ]);

  assert.equal(getUsersMock.mock.callCount(), 1);
});
