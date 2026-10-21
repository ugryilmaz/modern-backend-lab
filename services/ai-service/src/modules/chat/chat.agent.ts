import { generateText, Output, stepCountIs, tool, type ModelMessage } from 'ai';
import { runOrderWorkflow } from './chat.workflow.js';
import { chatInstructions } from './chat.instructions.js';
import { chatAgentOutputSchema, orderWorkflowSchema } from './chat.schema.js';
import { model } from './chat-sdk.services.js';
import { containsInstructionLeak } from './chat.guardrails.js';

type RunChatAgentOptions = {
  messages: ModelMessage[];
  activeOrderId: string | null;
  userId: number;
  abortSignal: AbortSignal;
};

type RunOrderWorkerToolOptions = {
  activeOrderId: string | null;
  userId: number;
};

export const RunOrderWorkerTool = ({
  activeOrderId,
  userId,
}: RunOrderWorkerToolOptions) =>
  tool({
    description: 'Sipariş durumu veya tahmini teslimat sorgularını yürütür.',
    inputSchema: orderWorkflowSchema,
    execute: async ({ intent }, { abortSignal }) => {
      if (!activeOrderId) {
        return 'Sipariş numaranızı paylaşır mısınız?';
      }

      return runOrderWorkflow({
        intent,
        orderId: activeOrderId,
        userId,
        abortSignal,
      });
    },
  });

export const runChatAgent = async ({
  messages,
  activeOrderId,
  userId,
  abortSignal,
}: RunChatAgentOptions): Promise<string> => {
  const result = await generateText({
    model,
    system: chatInstructions,
    tools: {
      run_order_workflow: RunOrderWorkerTool({
        activeOrderId,
        userId,
      }),
    },
    stopWhen: stepCountIs(3),
    messages,
    temperature: 0.2,
    abortSignal,
  }).catch((error: unknown) => {
    if (abortSignal.aborted) {
      throw abortSignal.reason;
    }

    throw error;
  });

  const response = result.text.trim();

  if (!response) {
    return 'Şu anda yanıt oluşturamadım. Lütfen tekrar deneyin.';
  }

  if (containsInstructionLeak(response)) {
    return 'Bu isteğe güvenli biçimde yanıt veremiyorum.';
  }

  return response;
};
