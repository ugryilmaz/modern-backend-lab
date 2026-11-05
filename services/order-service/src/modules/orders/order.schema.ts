import { z } from 'zod';

export const orderIdParamsSchema = z.object({
  orderId: z.string(),
});
