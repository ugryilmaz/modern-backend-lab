import 'dotenv/config';
import { app } from './app.js';
import {
  connectRedis,
  connectSubscriber,
  subscribeToChannel,
} from '../lib/redis.js';

const start = async () => {
  try {
    await connectRedis();
    await connectSubscriber();
    await subscribeToChannel('user.updated', (message) => {
      const event = JSON.parse(message);

      console.log('User updated event:', event);
    });
    await app.listen({
      port: 3004,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
