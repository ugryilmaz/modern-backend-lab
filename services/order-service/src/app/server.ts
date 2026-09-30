import { setupRabbitMQ } from '../lib/rabbitmq.js';
import { app } from './app.js';

const start = async () => {
  try {
    await setupRabbitMQ();
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
