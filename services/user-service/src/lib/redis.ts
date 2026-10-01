import { createClient } from 'redis';

import { env } from '../config/env.js';

export const redis = createClient({
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

export const subscriber = redis.duplicate();

subscriber.on('error', (error) => {
  console.error('Redis Subscriber Error', error);
});

export const connectSubscriber = async () => {
  if (!subscriber.isOpen) {
    await subscriber.connect();
  }
};

export const subscribeToChannel = async (
  channel: string,
  handler: (message: string) => void,
) => {
  await subscriber.subscribe(channel, handler);
};
