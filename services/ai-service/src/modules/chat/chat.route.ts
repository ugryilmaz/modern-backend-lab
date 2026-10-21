import type { FastifyInstance } from 'fastify';
import aiService from './chat.service.js';
import { randomUUID } from 'crypto';
import { authenticate } from '@modern-backend-lab/shared';
import { chatRequestSchema, mcpChatRequestSchema } from './chat.schema.js';
import mcpClient from '../mcp/mcp.client.js';
import { generateText, stepCountIs, type ToolSet } from 'ai';
import { model } from './chat-sdk.services.js';
import { z } from 'zod';

const chatRoutes = (app: FastifyInstance) => {
  app.post('/chat', { preHandler: authenticate }, async (request, reply) => {
    const input = chatRequestSchema.safeParse(request.body);

    if (!input.success) {
      return reply.code(400).send({
        message: 'Geçersiz istek.',
        errors: input.error.issues,
      });
    }

    const conversationId = input.data.conversationId ?? randomUUID();

    try {
      const response = await aiService.chat(
        input.data.message,
        conversationId,
        request.user.sub,
        request.signal,
      );
      return { response, conversationId };
    } catch (error) {
      if (request.signal.aborted) {
        request.log.info(
          { reason: request.signal.reason },
          'AI request aborted',
        );

        return;
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        request.log.warn({ err: error }, 'AI request timed out');

        return reply.code(504).send({
          message: 'AI isteği zaman aşımına uğradı. Lütfen tekrar deneyin.',
        });
      }

      request.log.error({ err: error }, 'AI request failed');

      return reply.code(502).send({
        message: 'AI modelinden yanıt alınamadı.',
      });
    }
  });
  app.post(
    '/mcp/chat',
    { preHandler: authenticate },
    async (request, reply) => {
      const input = mcpChatRequestSchema.safeParse(request.body);

      if (!input.success) {
        return reply.code(400).send({
          message: 'Geçersiz istek.',
          errors: input.error.issues,
        });
      }
      const tools = (await mcpClient.tools({
        schemas: {
          get_sample_product: {
            inputSchema: z.object({
              sku: z.enum(['KB-100', 'MS-200']),
            }),
            outputSchema: z.object({
              sku: z.string(),
              name: z.string(),
              price: z.number(),
              currency: z.string(),
              stockCount: z.number(),
            }),
          },
        },
      })) as ToolSet;

      try {
        const result = await generateText({
          model,
          system:
            'Sen Modern Backend Lab için yardımcı bir asistansın. ' +
            'Lab konularında get_lab_topic aracını kullan. ' +
            'Ürün sorgularında get_sample_product aracını kullan. ' +
            'Yanıtını araçtan gelen bilgiye dayandır ve Türkçe cevap ver.',
          prompt: input.data.message,
          tools,
          stopWhen: stepCountIs(3),
          temperature: 0.2,
          abortSignal: request.signal,
        });

        return {
          response:
            result.text.trim() ||
            'Şu anda yanıt oluşturamadım. Lütfen tekrar deneyin.',
        };
      } catch (error) {
        if (request.signal.aborted) {
          request.log.info('MCP chat request aborted');
          return;
        }

        request.log.error({ err: error }, 'MCP chat request failed');

        await mcpClient.close();

        return reply.code(502).send({
          message: 'MCP üzerinden yanıt alınamadı.',
        });
      }
    },
  );
};

export default chatRoutes;
