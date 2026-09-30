import amqp from 'amqplib';
import { env } from '../config/env.js';
import { randomUUID } from 'crypto';
import type { EventEnvelope } from './events/event.type.js';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async (): Promise<amqp.Channel> => {
  if (!connection || !channel) {
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log('RabbitMQ connected');
  }

  return channel;
};

export const setupRabbitMQ = async () => {
  const channel = await connectRabbitMQ();

  await channel.assertExchange('order.events', 'topic', { durable: true });

  await channel.assertQueue('notification.queue', { durable: true });

  await channel.bindQueue(
    'notification.queue',
    'order.events',
    'order.created',
  );

  console.log('Notification Service RabbitMQ exchange ready');

  return channel;
};

export const consumeEvent = async <T>(
  queue: string,
  handler: (event: T) => Promise<void>,
) => {
  const channel = await connectRabbitMQ();

  await channel.consume(queue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const content = message.content.toString();
      const event = JSON.parse(content) as T;

      await handler(event);
      channel.ack(message);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
};
