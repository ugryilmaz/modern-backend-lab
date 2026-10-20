import { generateText, stepCountIs, tool, type ModelMessage } from 'ai';
import { runOrderWorkflow } from './chat.workflow.js';
import { chatInstructions } from './chat.instructions.js';
import { orderWorkflowSchema } from './chat.schema.js';
import { model } from './chat-sdk.services.js';

type RunChatAgentOptions = {
  messages: ModelMessage[];
  summary: string;
  activeOrderId: string | null;
  userId: number;
  abortSignal: AbortSignal;
};

export const runChatAgent = async ({
  messages,
  summary,
  activeOrderId,
  userId,
  abortSignal,
}: RunChatAgentOptions): Promise<string> => {
  const result = await generateText({
    model,
    system: chatInstructions({
      summary,
      activeOrderId,
    }),
    tools: {
      run_order_workflow: tool({
        description:
          'Sipariş durumu veya tahmini teslimat sorgularını yürütür. ' +
          'Önceki mesajdaki siparişe ilişkin takip sorularında da kullanılabilir. ' +
          'Siparişle ilgisiz sorular için kullanılmamalıdır. ' +
          'Sipariş numarasını kendin belirleme; uygulama aktif sipariş bağlamını sağlar.',
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

  return (
    result.text.trim() || 'Şu anda yanıt oluşturamadım. Lütfen tekrar deneyin.'
  );
};
