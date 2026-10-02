import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
