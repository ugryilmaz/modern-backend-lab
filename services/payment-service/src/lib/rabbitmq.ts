import amqp from 'amqplib';
import { env } from '../config/env.js';
import db from '../db/client.js';

import type {
  EventEnvelope,
  OrderCreatedPayload,
} from './events/event.type.js';
import { orderReadModel } from '../db/schema.js';

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

  await channel.assertExchange('order-read-projection.dlx', 'direct', {
    durable: true,
  });

  await channel.assertQueue('order-read-projection.dlq', {
    durable: true,
  });

  await channel.bindQueue(
    'order-read-projection.dlq',
    'order-read-projection.dlx',
    'projection.failed',
  );

  await channel.assertQueue('order-read-projection.queue', {
    durable: true,
    arguments: {
      'x-queue-type': 'quorum',
      'x-delayed-retry-type': 'failed',
      'x-delayed-retry-min': 5000,
      'x-delayed-retry-max': 30000,
      'x-delivery-limit': 5,
      'x-dead-letter-exchange': 'order-read-projection.dlx',
      'x-dead-letter-routing-key': 'projection.failed',
    },
  });

  await channel.bindQueue(
    'order-read-projection.queue',
    'order.events',
    'order.created',
  );

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

export const consumeOrderReadProjection = async () => {
  const channel = await connectRabbitMQ();

  await channel.consume('order-read-projection.queue', async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = JSON.parse(
        message.content.toString(),
      ) as EventEnvelope<OrderCreatedPayload>;

      const { orderId, userId } = event.data;

      await db
        .insert(orderReadModel)
        .values({
          orderId,
          userId,
        })
        .onConflictDoUpdate({
          target: orderReadModel.orderId,
          set: {
            userId,
          },
        });

      console.log('Order read projection updated:', orderId);

      channel.ack(message);
    } catch (error) {
      console.error('Order read projection processing failed:', error);

      channel.reject(message, true);
    }
  });

  console.log('Order Read Projection consumer started');
};
