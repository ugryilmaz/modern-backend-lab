import '@fastify/jwt';

export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: number;
  role: 'user' | 'admin';
  type: TokenType;
  jti?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
