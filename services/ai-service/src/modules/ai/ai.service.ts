import { app } from '../../app/app.js';
import { chatResponseSchema, getOrderStatusSchema } from './ai.schema.js';
import { aiTools, getOrderStatus } from './ai.tools.js';

enum code {
  TOOL_NOT_ALLOWED = 'TOOL_NOT_ALLOWED',
  INVALID_ARGUMENTS = 'INVALID_ARGUMENTS',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
}

const executeAiTool = async (toolName: string, args: unknown) => {
  switch (toolName) {
    case 'get_order_status':
      const parsedArgs = getOrderStatusSchema.safeParse(args);
      if (!parsedArgs.success) {
        return {
          ok: false,
          code: code.INVALID_ARGUMENTS,
          message: 'Invalid arguments for get_order_status',
        };
      }

      try {
        const data = await getOrderStatus(parsedArgs.data.orderId);
        return { ok: true, data };
      } catch (error) {
        app.log.error({ err: error, toolName }, 'AI tool execution failed');
        return {
          ok: false,
          code: code.TOOL_EXECUTION_FAILED,
          message: 'Failed to execute get_order_status',
        };
      }

    default:
      return {
        ok: false,
        code: code.TOOL_NOT_ALLOWED,
        message: 'This tool is not allowed.',
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
    throw new Error('Failed to get response from AI model');
  }

  const raw: unknown = await response.json();
  const result = chatResponseSchema.parse(raw);

  const toolCall = result.message.tool_calls?.[0];

  if (!toolCall) {
    return result.message.content;
  }

  const toolResult = await executeAiTool(
    toolCall.function.name,
    toolCall.function.arguments,
  );

  if (!toolResult.ok && toolResult.code === code.TOOL_EXECUTION_FAILED) {
    return 'Sipariş durumunu şu anda kontrol edemiyoruz. Lütfen daha sonra tekrar deneyin.';
  }

  messages.push({
    role: 'assistant',
    content: result.message.content,
    tool_calls: result.message.tool_calls,
  });

  messages.push({
    role: 'tool',
    tool_name: toolCall.function.name,
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
