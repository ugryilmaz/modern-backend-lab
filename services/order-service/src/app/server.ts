import { setupRabbitMQ } from '../lib/rabbitmq.js';
import { startOutboxPublisher } from '../modules/outbox/outbox.publisher.js';
import { app } from './app.js';

const start = async () => {
  try {
    await setupRabbitMQ();
    startOutboxPublisher();
    await app.listen({
      port: 3002,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
