import { generateText } from 'ai';
import { ollama } from 'ai-sdk-ollama';

export const model = ollama('qwen3.5:4b');

const generateSdkReply = async (prompt: string): Promise<string> => {
  const { text } = await generateText({
    model,
    prompt,
    temperature: 0.2,
    maxOutputTokens: 120,
  });

  return text;
};

export const summaryModel = ollama('gemma4:e2b', {
  think: false,
});

export default { generateSdkReply, summaryModel };
