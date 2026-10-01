import amqp from 'amqplib';
import { env } from '../config/env.js';
import { randomUUID } from 'crypto';
import type { EventEnvelope } from './events/event.type.js';
import { saveInboxEvent } from '../modules/inbox/inbox.service.js';
import { inbox } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import db from '../db/client.js';

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

export const consumeEvents = async <T>(
  queue: string,
  handler: (event: T) => Promise<void>,
) => {
  const channel = await connectRabbitMQ();

  await channel.consume(queue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = JSON.parse(message.content.toString()) as EventEnvelope<T>;

      const inboxEvent = await saveInboxEvent(event);

      if (!inboxEvent) {
        throw new Error('Inbox event could not be saved');
      }

      if (inboxEvent.processedAt) {
        console.log('Duplicate event ignored:', event.eventId);

        channel.ack(message);
        return;
      }

      await handler(event);

      await db
        .update(inbox)
        .set({
          processedAt: new Date(),
        })
        .where(eq(inbox.id, inboxEvent.id));

      channel.ack(message);
    } catch (error) {
      console.error('Message processing failed:', error);
    }
  });
};
