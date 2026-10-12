import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import db from '../../db/client.js';
import { paymentIdempotencyKeys, payments } from '../../db/schema.js';

interface CreatePaymentCommand {
  orderId: string;
  idempotencyKey: string;
}

type CreatePaymentResult =
  | { kind: 'created'; payment: typeof payments.$inferSelect; replayed: false }
  | { kind: 'replayed'; payment: typeof payments.$inferSelect; replayed: true }
  | { kind: 'key_conflict' };

export const createPayment = async ({
  orderId,
  idempotencyKey,
}: CreatePaymentCommand): Promise<CreatePaymentResult> => {
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ orderId }))
    .digest('hex');

  return db.transaction(async (tx) => {
    const [claimedKey] = await tx
      .insert(paymentIdempotencyKeys)
      .values({
        key: idempotencyKey,
        requestHash,
      })
      .onConflictDoNothing({
        target: paymentIdempotencyKeys.key,
      })
      .returning();

    if (!claimedKey) {
      const [existingKey] = await tx
        .select()
        .from(paymentIdempotencyKeys)
        .where(eq(paymentIdempotencyKeys.key, idempotencyKey))
        .limit(1);

      if (!existingKey) {
        throw new Error('Idempotency key conflict could not be resolved');
      }

      if (existingKey.requestHash !== requestHash) {
        return { kind: 'key_conflict' };
      }

      if (!existingKey.paymentId) {
        throw new Error('Completed idempotency record has no payment');
      }

      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, existingKey.paymentId))
        .limit(1);

      if (!payment) {
        throw new Error('Idempotency record references a missing payment');
      }

      return { kind: 'replayed', payment, replayed: true };
    }

    const [payment] = await tx
      .insert(payments)
      .values({
        orderId,
        status: 'PENDING',
      })
      .returning();

    if (!payment) {
      throw new Error('Payment creation returned no record');
    }

    await tx
      .update(paymentIdempotencyKeys)
      .set({ paymentId: payment.id })
      .where(eq(paymentIdempotencyKeys.key, idempotencyKey));

    return { kind: 'created', payment, replayed: false };
  });
};
