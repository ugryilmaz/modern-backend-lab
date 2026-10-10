import { chatResponseSchema, getOrderStatusSchema } from './ai.schema.js';
import { aiTools, getOrderStatus } from './ai.tools.js';

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

  if (toolCall.function.name !== 'get_order_status') {
    throw new Error('Unsupported tool');
  }

  const args = getOrderStatusSchema.parse(toolCall.function.arguments);

  const toolResult = await getOrderStatus(args.orderId);

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
