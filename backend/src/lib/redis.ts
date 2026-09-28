import { createClient } from 'redis';
import { env } from '../config/env.js';

const redis = createClient({
  url: env.REDIS_URL,
});

redis.on('error', (error) => {
  console.error('Redis Client Error', error);
});

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};
export default redis;
