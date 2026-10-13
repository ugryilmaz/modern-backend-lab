import { generateText, stepCountIs, tool } from 'ai';
import { app } from '../../app/app.js';
import {
  getEstimatedDeliverySchema,
  getOrderStatusSchema,
} from './ai.schema.js';
import { getEstimatedDelivery, getOrderStatus } from './ai.tools.js';
import { model } from './ai-sdk.services.js';

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

type OrderResult = {
  orderId: string;
  status: string;
  carrier?: string;
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
    case 'get_estimated_delivery': {
      const parsedArgs = getEstimatedDeliverySchema.safeParse(args);

      if (!parsedArgs.success) {
        return {
          ok: false,
          code: code.INVALID_ARGUMENTS,
          message: getToolFailureMessage(toolName, code.INVALID_ARGUMENTS),
        };
      }

      try {
        const data = await getEstimatedDelivery(parsedArgs.data.orderId);

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

const formatOrderResponse = (order: OrderResult): string => {
  if (order.status === 'not_found') {
    return `${order.orderId} numaralı sipariş için bir kayıt bulunamadı.`;
  }

  const status = order.status === 'shipped' ? 'kargoya verildi' : order.status;

  return order.carrier
    ? `${order.orderId} numaralı siparişinizin durumu "${status}". Kargo şirketi ${order.carrier}.`
    : `${order.orderId} numaralı siparişinizin durumu "${status}".`;
};

const chatResponse = async (message: string): Promise<string> => {
  let executedToolResult: AiToolResult | undefined;
  const result = await generateText({
    model,
    system:
      'Sipariş sorgularında şu kuralları izle: ' +
      '1. Kullanıcının mesajında sipariş numarası varsa önce get_order_status aracını çağır. ' +
      '2. Sipariş bulunamazsa başka araç çağırma; kaydın bulunamadığını belirt. ' +
      '3. Sipariş durumu repair ise get_estimated_delivery aracını da çağır. ' +
      '4. Kullanıcı tahmini teslim tarihini açıkça isterse get_estimated_delivery aracını çağır. ' +
      '5. Araç sonuçlarına dayanarak Türkçe ve kısa yanıt ver; bilgi uydurma. ' +
      '6. Sipariş numarası yoksa kullanıcıdan numarayı iste. ' +
      'Diğer soruları normal şekilde yanıtla.',
    prompt: message,
    tools: {
      get_order_status: tool({
        description:
          'Verilen sipariş numarasına ait mevcut sipariş durumunu getirir.',
        inputSchema: getOrderStatusSchema,

        execute: async (args): Promise<AiToolResult> => {
          const orderId = extractOrderId(message);

          if (!orderId) {
            executedToolResult = {
              ok: false,
              code: code.INVALID_ARGUMENTS,
              message: 'Sipariş numaranızı paylaşır mısınız?',
            };

            return executedToolResult;
          }

          if (args.orderId.toUpperCase() !== orderId) {
            app.log.warn(
              { toolName: 'get_order_status' },
              'AI tool arguments did not match user message',
            );
          }

          executedToolResult = await executeAiTool('get_order_status', {
            orderId,
          });

          return executedToolResult;
        },
      }),
      get_estimated_delivery: tool({
        description:
          'Verilen sipariş numarasının tahmini teslimat tarihini getirir.',
        inputSchema: getEstimatedDeliverySchema,
        execute: async (args): Promise<AiToolResult> => {
          const orderId = extractOrderId(message);

          if (!orderId) {
            executedToolResult = {
              ok: false,
              code: code.INVALID_ARGUMENTS,
              message: 'Sipariş numaranızı paylaşır mısınız?',
            };

            return executedToolResult;
          }

          if (args.orderId.toUpperCase() !== orderId) {
            app.log.warn(
              { toolName: 'get_estimated_delivery' },
              'AI tool arguments did not match user message',
            );
          }

          executedToolResult = await executeAiTool('get_estimated_delivery', {
            orderId,
          });

          return executedToolResult;
        },
      }),
    },
    stopWhen: stepCountIs(3),
    temperature: 0.2,
    abortSignal: AbortSignal.timeout(30_000),
  });

  app.log.info(
    {
      steps: result.steps.map((step, index) => ({
        step: index + 1,
        toolCalls: step.toolCalls.map((call) => call.toolName),
        finishReason: step.finishReason,
      })),
    },
    'AI agent execution steps',
  );

  if (executedToolResult) {
    if (!executedToolResult.ok) {
      return executedToolResult.message;
    }

    return (
      result.text.trim() ||
      formatOrderResponse(executedToolResult.data as OrderResult)
    );
  }

  return (
    result.text.trim() || 'Şu anda yanıt oluşturamadım. Lütfen tekrar deneyin.'
  );
};

export default {
  chatResponse,
};
