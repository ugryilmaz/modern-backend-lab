import type { ModelMessage } from 'ai';

export const selectSlidingWindow = (
  messages: ModelMessage[],
  maxMessages: number,
): ModelMessage[] => {
  if (!Number.isInteger(maxMessages) || maxMessages < 0) {
    throw new RangeError('maxMessages must be a non-negative integer');
  }

  if (maxMessages === 0) {
    return [];
  }

  return messages.slice(-maxMessages);
};

export const splitMessagesForSummary = (
  messages: ModelMessage[],
  recentMessageCount: number,
): {
  messagesToSummarize: ModelMessage[];
  recentMessages: ModelMessage[];
} => {
  if (!Number.isInteger(recentMessageCount) || recentMessageCount < 1) {
    throw new RangeError('recentMessageCount must be a positive integer');
  }

  const splitIndex = Math.max(0, messages.length - recentMessageCount);

  return {
    messagesToSummarize: messages.slice(0, splitIndex),
    recentMessages: messages.slice(splitIndex),
  };
};
