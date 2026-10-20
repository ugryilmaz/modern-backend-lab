import type { FastifyRequest } from 'fastify';

const requireRole = (...roles: ('user' | 'admin')[]) => {
  return async (request: FastifyRequest) => {
    if (!roles.includes(request.user.role)) {
      throw request.server.httpErrors.forbidden('forbidden');
    }
  };
};

export default requireRole;
