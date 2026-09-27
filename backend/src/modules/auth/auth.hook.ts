import type { FastifyRequest } from 'fastify';

const authenticate = async (request: FastifyRequest) => {
  await request.jwtVerify();
};

export default authenticate;
