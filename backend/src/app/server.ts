import 'dotenv/config';
import app from './app.js';
import {
  connectRedis,
  connectSubscriber,
  subscribeToChannel,
} from '../lib/redis.js';

import {
  connectRabbitMQ,
  publishEvent,
  consumeEvents,
  setupRabbitMQ,
} from '../lib/rabbitmq.js';
import { handleOrderCreated } from '../modules/notifications/notification.service.js';

const start = async () => {
  await setupRabbitMQ();

  await connectRedis();
  await connectSubscriber();
  await subscribeToChannel('user.updated', (message) => {
    const event = JSON.parse(message);

    console.log('User updated event:', event);
  });

  /*app.get('/instance', async () => {
    return {
      instance: os.hostname(),
      message: 'Docker hot reload çalışıyor',
    };
  });*/

  await consumeEvents('notification.queue', handleOrderCreated);

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
