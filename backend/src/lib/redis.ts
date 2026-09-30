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

export const publishMessage = async (channel: string, message: string) => {
  await redis.publish(channel, message);
};

export const isEventProcessed = async (eventId: string) => {
  const result = await redis.exists(`event:processed:${eventId}`);

  return result === 1;
};

export const markEventAsProcessed = async (eventId: string) => {
  await redis.set(`event:processed:${eventId}`, '1');
};
