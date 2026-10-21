import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.uuid().optional(),
});

export const mcpChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export const chatAgentOutputSchema = z.object({
  response: z.string().min(1).max(3000),
});

export const getOrderStatusSchema = z.object({
  orderId: z.string().trim().min(1),
});

export const getEstimatedDeliverySchema = getOrderStatusSchema;

export const orderWorkflowSchema = z.object({
  intent: z.enum(['order_status', 'delivery_estimate']),
});

export type OrderWorkflowInput = z.infer<typeof orderWorkflowSchema>;
