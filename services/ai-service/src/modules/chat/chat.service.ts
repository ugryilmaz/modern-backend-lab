import { type ModelMessage } from 'ai';
import {
  selectSlidingWindow,
  splitMessagesForSummary,
} from './chat.context.js';
import chatSummarize from './chat.summarize.js';
import { runChatAgent } from './chat.agent.js';

type ConversationState = {
  summary: string;
  messages: ModelMessage[];
  activeOrderId: string | null;
};

const conversationStore = new Map<string, ConversationState>();

const RECENT_CONTEXT_MESSAGES = 7;
const MAX_CONTEXT_MESSAGES = 11;

const extractOrderId = (message: string): string | null => {
  const match = message.match(/\bORD-\d+\b/i);

  return match?.[0].toUpperCase() ?? null;
};

const chat = async (
  message: string,
  conversationId: string,
  userId: number,
  requestSignal: AbortSignal,
): Promise<string> => {
  const operationSignal = AbortSignal.any([
    requestSignal,
    AbortSignal.timeout(30_000),
  ]);

  const conversationKey = `${userId}:${conversationId}`;
  const conversation = conversationStore.get(conversationKey) ?? {
    summary: '',
    messages: [],
    activeOrderId: null,
  };

  const activeOrderId = extractOrderId(message) ?? conversation.activeOrderId;

  const messages: ModelMessage[] = [
    ...conversation.messages,
    { role: 'user', content: message },
  ];

  let summary = conversation.summary;
  let contextMessages: ModelMessage[];

  if (messages.length > MAX_CONTEXT_MESSAGES) {
    const { messagesToSummarize, recentMessages } = splitMessagesForSummary(
      messages,
      RECENT_CONTEXT_MESSAGES,
    );

    summary = await chatSummarize(
      summary,
      messagesToSummarize,
      operationSignal,
    );

    contextMessages = recentMessages;
  } else {
    contextMessages = selectSlidingWindow(messages, MAX_CONTEXT_MESSAGES);
  }

  const responseText = await runChatAgent({
    messages: contextMessages,
    summary,
    activeOrderId,
    userId,
    abortSignal: operationSignal,
  });

  conversationStore.set(conversationKey, {
    summary,
    messages: [
      ...contextMessages,
      { role: 'assistant', content: responseText },
    ],
    activeOrderId,
  });

  return responseText;
};

export default {
  chat,
};
