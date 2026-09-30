import 'dotenv/config';
import app from './app.js';
import {
  connectRedis,
  connectSubscriber,
  subscribeToChannel,
} from '../lib/redis.js';
import os from 'node:os';

const start = async () => {
  await connectRedis();
  await connectSubscriber();
  await subscribeToChannel('user.updated', (message) => {
    const event = JSON.parse(message);

    console.log('User updated event:', event);
  });
  app.get('/instance', async () => {
    return {
      instance: os.hostname(),
      message: 'Docker hot reload çalışıyor',
    };
  });
  try {
    await app.listen({
      port: 3001,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
