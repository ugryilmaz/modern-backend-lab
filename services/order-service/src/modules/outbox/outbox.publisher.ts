import { eq, isNull } from 'drizzle-orm';

import { publishOutboxEvent } from '../../lib/rabbitmq.js';
import db from '../../db/client.js';
import { outbox } from '../../db/schema.js';

export const processOutbox = async () => {
  const events = await db
    .select()
    .from(outbox)
    .where(isNull(outbox.publishedAt));

  for (const event of events) {
    await publishOutboxEvent(event.eventType, event.payload);

    await db
      .update(outbox)
      .set({
        publishedAt: new Date(),
      })
      .where(eq(outbox.id, event.id));
  }
};

export const startOutboxPublisher = () => {
  const run = async () => {
    try {
      await processOutbox();
    } catch (error) {
      console.error('Outbox publisher failed:', error);
    }

    setTimeout(run, 2000);
  };

  run();
};
