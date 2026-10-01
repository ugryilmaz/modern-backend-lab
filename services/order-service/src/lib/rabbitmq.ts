import amqp from 'amqplib';
import { env } from '../config/env.js';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.ConfirmChannel | null = null;

export const connectRabbitMQ = async (): Promise<amqp.ConfirmChannel> => {
  if (!connection || !channel) {
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createConfirmChannel();

    console.log('RabbitMQ connected');
  }

  return channel;
};

export const setupRabbitMQ = async () => {
  const channel = await connectRabbitMQ();

  await channel.assertExchange('order.events', 'topic', { durable: true });

  console.log('Order Service RabbitMQ exchange ready');
};

export const publishOutboxEvent = async (
  eventType: string,
  payload: unknown,
) => {
  const channel = await connectRabbitMQ();

  const content = Buffer.from(JSON.stringify(payload));

  channel.publish('order.events', eventType, content, { persistent: true });

  await channel.waitForConfirms();
};
