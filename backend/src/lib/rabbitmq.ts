import * as amqp from 'amqplib';
import { env } from '../config/env.js';

import type { EventEnvelope } from '../modules/orders/order.types.js';
import { randomUUID } from 'crypto';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async () => {
  if (!connection || !channel) {
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log('RabbitMQ connected');
  }

  return channel;
};

export const setupRabbitMQ = async () => {
  const channel = await connectRabbitMQ();

  await channel.assertExchange('order.events', 'topic', {
    durable: true,
  });

  await channel.assertQueue('notification.queue', {
    durable: true,
  });

  await channel.bindQueue(
    'notification.queue',
    'order.events',
    'order.created',
  );

  await channel.assertQueue('notification.retry', {
    durable: true,
    arguments: {
      'x-message-ttl': 5000,
      'x-dead-letter-exchange': 'order.events',
      'x-dead-letter-routing-key': 'order.created',
    },
  });

  await channel.assertQueue('notification.dlq', {
    durable: true,
  });

  console.log('RabbitMQ exchange, queue and binding ready');
};

export const publishEvent = async <T>(type: string, data: T) => {
  const channel = await connectRabbitMQ();

  const event: EventEnvelope<T> = {
    eventId: randomUUID(),
    type,
    version: 1,
    occurredAt: new Date().toISOString(),
    source: 'backend',
    data,
  };

  const content = Buffer.from(JSON.stringify(event));

  channel.publish('order.events', type, content);
};

export const consumeEvents = async <T>(
  queue: string,
  handler: (message: T) => Promise<void>,
) => {
  const channel = await connectRabbitMQ();

  await channel.consume(queue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const content = message.content.toString();
      const event = JSON.parse(content);

      await handler(event);

      channel.ack(message);
    } catch (error) {
      console.error('Message processing failed:', error);

      const retryCount = Number(
        message.properties.headers?.['x-retry-count'] ?? 0,
      );

      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        channel.sendToQueue('notification.dlq', message.content, {
          persistent: true,
          headers: {
            ...message.properties.headers,
          },
        });

        channel.nack(message, false, false);

        console.log('Message moved to DLQ');
        return;
      }

      channel.sendToQueue('notification.retry', message.content, {
        persistent: true,
        headers: {
          ...message.properties.headers,
          'x-retry-count': retryCount + 1,
        },
      });

      channel.nack(message, false, false);

      console.log(`Message retry scheduled: ${retryCount + 1}`);
    }
  });
};
