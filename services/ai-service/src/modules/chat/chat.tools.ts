type Order = {
  ownerUserId: number;
  status: string;
  carrier: string;
  estimatedDelivery: string;
};

const orders: Record<string, Order> = {
  'ORD-1001': {
    ownerUserId: 1,
    status: 'shipped',
    carrier: 'Yurtiçi Kargo',
    estimatedDelivery: '2026-10-15',
  },
  'ORD-1002': {
    ownerUserId: 1,
    status: 'repair',
    carrier: 'MNG Kargo',
    estimatedDelivery: '2026-10-20',
  },
  'ORD-1003': {
    ownerUserId: 2,
    status: 'shipped',
    carrier: 'Aras Kargo',
    estimatedDelivery: '2026-10-25',
  },
};

export const getOrderStatus = async (orderId: string, userId: number) => {
  const order = orders[orderId];

  if (!order || order.ownerUserId !== userId) {
    return {
      orderId,
      status: 'not_found',
    };
  }

  return {
    orderId,
    status: order.status,
    carrier: order.carrier,
    estimatedDelivery: order.estimatedDelivery,
  };
};

export const getEstimatedDelivery = async (orderId: string, userId: number) => {
  const order = orders[orderId];

  if (!order || order.ownerUserId !== userId) {
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
