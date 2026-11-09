import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const gatewayUrl = 'http://localhost:3000';

test('register ve login akışı Gateway üzerinden tamamlanmalı', async (t) => {
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'E2E-test-password-2026';

  let refreshCookie: string | undefined = undefined;

  t.after(async () => {
    if (!refreshCookie) {
      return;
    }

    const logoutResponse = await fetch(`${gatewayUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: refreshCookie,
      },
    });

    assert.equal(logoutResponse.status, 200);
  });

  const registerResponse = await fetch(`${gatewayUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  assert.equal(registerResponse.status, 201);

  const registeredUser = (await registerResponse.json()) as {
    id: number;
    email: string;
    role: string;
  };

  assert.equal(registeredUser.email, email);
  assert.equal(registeredUser.role, 'user');

  const loginResponse = await fetch(`${gatewayUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  assert.equal(loginResponse.status, 200);

  const loginData = (await loginResponse.json()) as {
    accessToken: string;
    user: {
      id: number;
      email: string;
      role: string;
    };
  };

  assert.equal(loginData.user.id, registeredUser.id);
  assert.equal(loginData.user.email, email);
  assert.ok(loginData.accessToken);

  refreshCookie = loginResponse.headers.get('set-cookie')?.split(';', 1)[0];

  assert.ok(refreshCookie?.startsWith('refreshToken='));

  const protectedResponse = await fetch(`${gatewayUrl}/v1/users`, {
    headers: {
      authorization: `Bearer ${loginData.accessToken}`,
    },
  });

  assert.equal(protectedResponse.status, 403);
});
