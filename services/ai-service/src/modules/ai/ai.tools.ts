const orders: Record<string, { status: string; carrier: string }> = {
  'ORD-1001': {
    status: 'shipped',
    carrier: 'Yurtiçi Kargo',
  },
};

export const getOrderStatus = async (orderId: string) => {
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

export const aiTools = [
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Bir siparişin durumunu sorgulamak için kullanılır.',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: "Sorgulanacak siparişin ID'si",
          },
        },
        required: ['orderId'],
      },
    },
  },
];
