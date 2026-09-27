import '@fastify/jwt';

export interface JwtPayload {
  sub: number;
  role: 'user' | 'admin';
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
