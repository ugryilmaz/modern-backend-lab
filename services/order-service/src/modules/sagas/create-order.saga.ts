import {
  cancelOrder,
  confirmOrder,
  createOrder,
} from '../commands/order.commands.js';

export const createOrdersSaga = async (userId: string) => {
  const order = await createOrder({ userId });

  try {
    const response = await fetch(`http://localhost:3005/payments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    const confirmedOrder = await confirmOrder(order.id);

    return confirmedOrder;
  } catch (error) {
    console.error('Create Order Saga failed:', error);

    const cancelledOrder = await cancelOrder(order.id);

    return cancelledOrder;
  }
};
