import { consumeEvents, setupRabbitMQ } from '../lib/rabbitmq.js';
import { handleOrderCreated } from '../modules/notifications/notfication.service.js';
import { app } from './app.js';

const start = async () => {
  try {
    await setupRabbitMQ();
    await consumeEvents('notification.queue', handleOrderCreated);
    await app.listen({
      port: 3003,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
