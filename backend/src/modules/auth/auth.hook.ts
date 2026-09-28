import type { FastifyRequest } from 'fastify';

const authenticate = async (request: FastifyRequest) => {
  await request.jwtVerify();

  if (request.user.type !== 'access') {
    throw request.server.httpErrors.unauthorized('Invalid token');
  }
};

export default authenticate;
