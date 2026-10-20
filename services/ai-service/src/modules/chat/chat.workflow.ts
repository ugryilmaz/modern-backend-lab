import { getEstimatedDelivery, getOrderStatus } from './chat.tools.js';

export type OrderWorkflowIntent = 'order_status' | 'delivery_estimate';

type OrderResult = {
  orderId: string;
  status: string;
  carrier?: string;
};

type DeliveryResult = {
  orderId: string;
  estimatedDelivery?: string;
  status?: string;
};

const formatOrderResponse = (order: OrderResult): string => {
  if (order.status === 'not_found') {
    return `${order.orderId} numaralı sipariş için bir kayıt bulunamadı.`;
  }

  let status = order.status;

  if (order.status === 'shipped') {
    status = 'kargoya verildi';
  } else if (order.status === 'repair') {
    status = 'tamir sürecinde';
  }

  return order.carrier
    ? `${order.orderId} numaralı siparişinizin durumu "${status}". Kargo şirketi ${order.carrier}.`
    : `${order.orderId} numaralı siparişinizin durumu "${status}".`;
};

const formatDeliveryResponse = (delivery: DeliveryResult): string => {
  if (delivery.status === 'not_found') {
    return `${delivery.orderId} numaralı sipariş için bir kayıt bulunamadı.`;
  }

  if (delivery.estimatedDelivery) {
    return (
      `${delivery.orderId} numaralı sipariş için tahmini teslim tarihi ` +
      `${delivery.estimatedDelivery}.`
    );
  }

  return 'Tahmini teslimat bilgisi bulunamadı.';
};

export const runOrderWorkflow = async ({
  intent,
  orderId,
  userId,
  abortSignal,
}: {
  intent: OrderWorkflowIntent;
  orderId: string;
  userId: number;
  abortSignal?: AbortSignal;
}): Promise<string> => {
  abortSignal?.throwIfAborted();

  if (intent === 'delivery_estimate') {
    try {
      const delivery = await getEstimatedDelivery(orderId, userId);

      abortSignal?.throwIfAborted();

      return formatDeliveryResponse(delivery);
    } catch (error) {
      if (abortSignal?.aborted) {
        throw abortSignal.reason;
      }

      return 'İşlem şu anda tamamlanamıyor. Lütfen daha sonra tekrar deneyin.';
    }
  }

  let order: OrderResult;

  try {
    order = await getOrderStatus(orderId, userId);

    abortSignal?.throwIfAborted();
  } catch (error) {
    if (abortSignal?.aborted) {
      throw abortSignal.reason;
    }

    return 'İşlem şu anda tamamlanamıyor. Lütfen daha sonra tekrar deneyin.';
  }

  const response = formatOrderResponse(order);

  if (order.status !== 'repair') {
    return response;
  }

  let delivery: DeliveryResult;

  try {
    delivery = await getEstimatedDelivery(orderId, userId);

    abortSignal?.throwIfAborted();
  } catch (error) {
    if (abortSignal?.aborted) {
      throw abortSignal.reason;
    }

    return `${response} Tahmini teslimat bilgisi şu anda alınamadı.`;
  }

  if (delivery.status === 'not_found' || !delivery.estimatedDelivery) {
    return `${response} Tahmini teslimat bilgisi bulunamadı.`;
  }

  return `${response} Tahmini teslim tarihi ${delivery.estimatedDelivery}.`;
};
