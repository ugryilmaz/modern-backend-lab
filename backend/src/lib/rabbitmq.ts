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

    const content = message.content.toString();
    const event = JSON.parse(content);

    await handler(event);

    channel.ack(message);
  });
};
