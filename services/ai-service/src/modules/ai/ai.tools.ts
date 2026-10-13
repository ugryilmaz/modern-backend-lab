const orders: Record<
  string,
  { status: string; carrier: string; estimatedDelivery: string }
> = {
  'ORD-1001': {
    status: 'shipped',
    carrier: 'Yurtiçi Kargo',
    estimatedDelivery: '2026-10-15',
  },
  'ORD-1002': {
    status: 'repair',
    carrier: 'MNG Kargo',
    estimatedDelivery: '2026-10-20',
  },
};

export const getOrderStatus = async (orderId: string) => {
  /*if (orderId === 'ORD-ERROR') {
    throw new Error('Simulated order service failure');
  }*/
  const order = orders[orderId];
  if (!order) {
    return {
      orderId,
      status: 'not_found',
    };
  }

  return {
    orderId,
    ...order,
  };
};

export const getEstimatedDelivery = async (orderId: string) => {
  const order = orders[orderId];
  if (!order) {
    return {
      orderId,
      status: 'not_found',
    };
  }

  return {
    orderId,
    estimatedDelivery: order.estimatedDelivery,
  };
};
