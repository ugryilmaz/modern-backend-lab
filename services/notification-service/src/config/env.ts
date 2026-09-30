import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  RABBITMQ_URL: z.string(),
});

export const env = envSchema.parse(process.env);
