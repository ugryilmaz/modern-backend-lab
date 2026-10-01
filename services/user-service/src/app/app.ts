import Fastify, { type FastifyError } from "fastify";
import userRoutes from "../modules/users/user.routes.js";

export const app = Fastify({
  logger: true,
});

app.register(userRoutes);
