import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

const toolSchema = z.object({
  type: z.literal('function').optional(),
  function: z.object({
    index: z.number().optional(),
    name: z.string(),
    arguments: z.record(z.string(), z.unknown()),
  }),
});

export const chatResponseSchema = z.object({
  message: z.object({
    role: z.string().optional(),
    content: z.string(),
    tool_calls: z.array(toolSchema).optional(),
  }),
});

export const getOrderStatusSchema = z.object({
  orderId: z.string().trim().min(1),
});
