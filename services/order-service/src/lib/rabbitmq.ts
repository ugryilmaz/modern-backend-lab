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

  console.log('Order Service RabbitMQ exchange ready');
};

export const publishEvent = async <T>(type: string, data: T) => {
  const channel = await connectRabbitMQ();

  const event: EventEnvelope<T> = {
    eventId: randomUUID(),
    type,
    version: 1,
    occurredAt: new Date().toISOString(),
    source: 'order-service',
    data,
  };

  const content = Buffer.from(JSON.stringify(event));

  channel.publish('order.events', type, content);
};
