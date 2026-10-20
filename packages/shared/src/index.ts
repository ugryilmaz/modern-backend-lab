export const helloWorld = () => {
  return 'Hello, World!';
};

export { default as authenticate } from './auth/authenticate.hook.js';
export { default as requireRole } from './auth/require-role.hook.js';

export type { JwtPayload, TokenType } from './auth/auth.types.js';
