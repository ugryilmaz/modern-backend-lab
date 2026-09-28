import 'dotenv/config';
import app from './app.js';
import { connectRedis } from '../lib/redis.js';

const start = async () => {
  await connectRedis();
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
