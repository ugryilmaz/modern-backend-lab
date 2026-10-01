import { eq } from 'drizzle-orm';
import type { EventEnvelope } from '../../lib/events/event.type.js';
import db from '../../db/client.js';
import { inbox } from '../../db/schema.js';

export const saveInboxEvent = async (event: EventEnvelope<unknown>) => {
  const [inboxEvent] = await db
    .insert(inbox)
    .values({
      eventId: event.eventId,
      eventType: event.type,
      payload: event,
    })
    .onConflictDoNothing({
      target: inbox.eventId,
    })
    .returning();

  if (inboxEvent) {
    return inboxEvent;
  }

  const [existingEvent] = await db
    .select()
    .from(inbox)
    .where(eq(inbox.eventId, event.eventId))
    .limit(1);

  return existingEvent;
};
