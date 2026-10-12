import { z } from 'zod';
import { app } from '../../app/app.js';
import {
  chatResponseSchema,
  getOrderStatusSchema,
  intentRouteSchema,
} from './ai.schema.js';
import { aiTools, getOrderStatus } from './ai.tools.js';

enum code {
  TOOL_NOT_ALLOWED = 'TOOL_NOT_ALLOWED',
  INVALID_ARGUMENTS = 'INVALID_ARGUMENTS',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
}

type AiToolResult =
  | {
      ok: true;
      data: unknown;
    }
  | {
      ok: false;
      code: code;
      message: string;
    };

const extractOrderId = (message: string): string | null => {
  const match = message.match(/\bORD-\d+\b/i);

  return match?.[0].toUpperCase() ?? null;
};

const getToolFailureMessage = (toolName: string, errorCode: code): string => {
  switch (errorCode) {
    case code.INVALID_ARGUMENTS:
      return 'İstek için gerekli bilgiler geçerli değil. Lütfen kontrol edip tekrar deneyin.';

    case code.TOOL_NOT_ALLOWED:
      app.log.warn({ toolName }, 'AI requested an unsupported tool');

      return 'Bu işlem şu anda desteklenmiyor.';

    case code.TOOL_EXECUTION_FAILED:
      return 'İşlem şu anda tamamlanamıyor. Lütfen daha sonra tekrar deneyin.';

    default:
      return 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
  }
};

const classifyIntent = async (message: string) => {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma4:e2b',
      messages: [
        {
          role: 'system',
          content:
            'Kullanıcı mesajını yalnızca niyetine göre sınıflandır. ' +
            'Sipariş durumu sorgusu için order_status, ' +
            'genel sorular için general_chat kullan. ' +
            'Niyet belirsizse clarification kullan. ' +
            'Kullanıcıya cevap verme.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      format: z.toJSONSchema(intentRouteSchema),
      options: {
        temperature: 0,
      },
      think: false,
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Intent classification failed: ${response.status}`);
  }

  const raw: unknown = await response.json();
  const result = chatResponseSchema.parse(raw);
  const content: unknown = JSON.parse(result.message.content);

  return intentRouteSchema.parse(content);
};

const executeAiTool = async (
  toolName: string,
  args: unknown,
): Promise<AiToolResult> => {
  switch (toolName) {
    case 'get_order_status': {
      const parsedArgs = getOrderStatusSchema.safeParse(args);

      if (!parsedArgs.success) {
        return {
          ok: false,
          code: code.INVALID_ARGUMENTS,
          message: getToolFailureMessage(toolName, code.INVALID_ARGUMENTS),
        };
      }

      try {
        const data = await getOrderStatus(parsedArgs.data.orderId);

        return {
          ok: true,
          data,
        };
      } catch (error) {
        app.log.error({ err: error, toolName }, 'AI tool execution failed');

        return {
          ok: false,
          code: code.TOOL_EXECUTION_FAILED,
          message: getToolFailureMessage(toolName, code.TOOL_EXECUTION_FAILED),
        };
      }
    }

    default:
      return {
        ok: false,
        code: code.TOOL_NOT_ALLOWED,
        message: getToolFailureMessage(toolName, code.TOOL_NOT_ALLOWED),
      };
  }
};

const chatResponse = async (message: string) => {
  const messages: unknown[] = [
    {
      role: 'system',
      content:
        'Kullanıcı bir siparişin durumunu sorarsa ' +
        'get_order_status aracını kullan. ' +
        'Sipariş durumu uydurma.',
    },
    {
      role: 'user',
      content: message,
    },
  ];

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma4:e2b',
      messages,
      tools: aiTools,
      stream: false,
      options: {
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const raw: unknown = await response.json();
  const result = chatResponseSchema.parse(raw);
  const toolCall = result.message.tool_calls?.[0];

  if (!toolCall) {
    const intent = await classifyIntent(message);

    if (intent.intent === 'order_status') {
      const orderId = extractOrderId(message);

      if (!orderId) {
        return 'Sipariş numaranızı paylaşır mısınız?';
      }

      const toolResult = await executeAiTool('get_order_status', { orderId });

      if (!toolResult.ok) {
        return toolResult.message;
      }

      const order = toolResult.data as {
        orderId: string;
        status: string;
        carrier?: string;
      };

      if (order.status === 'not_found') {
        return `${order.orderId} numaralı sipariş için bir kayıt bulunamadı.`;
      }

      const status =
        order.status === 'shipped' ? 'kargoya verildi' : order.status;

      return order.carrier
        ? `${order.orderId} numaralı siparişinizin durumu "${status}". Kargo şirketi ${order.carrier}.`
        : `${order.orderId} numaralı siparişinizin durumu "${status}".`;
    }

    if (intent.intent === 'clarification') {
      return 'Ne konuda yardımcı olmamı istediğinizi biraz daha açıklar mısınız?';
    }

    return result.message.content;
  }

  const toolName = toolCall.function.name;
  let toolArgs: unknown = toolCall.function.arguments;

  if (toolName === 'get_order_status') {
    const orderId = extractOrderId(message);

    if (!orderId) {
      return 'Sipariş numaranızı paylaşır mısınız?';
    }

    const parsedArgs = getOrderStatusSchema.safeParse(toolArgs);

    if (
      !parsedArgs.success ||
      parsedArgs.data.orderId.toUpperCase() !== orderId
    ) {
      app.log.warn(
        { toolName },
        'AI tool arguments did not match user message',
      );
    }

    toolArgs = { orderId };
  }

  const toolResult = await executeAiTool(toolName, toolArgs);

  if (!toolResult.ok) {
    return toolResult.message;
  }

  messages.push({
    role: 'assistant',
    content: result.message.content,
    tool_calls: result.message.tool_calls,
  });

  messages.push({
    role: 'tool',
    tool_name: toolName,
    content: JSON.stringify(toolResult),
  });

  const followUpResponse = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma4:e2b',
      messages,
      stream: false,
      options: {
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!followUpResponse.ok) {
    throw new Error(`Ollama API error: ${followUpResponse.status}`);
  }

  const followUpRaw: unknown = await followUpResponse.json();

  const finalResult = chatResponseSchema.parse(followUpRaw);

  return finalResult.message.content;
};

export default {
  chatResponse,
};
