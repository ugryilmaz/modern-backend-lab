import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.url(),
  RABBITMQ_URL: z.string(),
  JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
