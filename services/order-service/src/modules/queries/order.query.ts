import orderRepository from '../orders/order.repository.js';

export const getOrders = async () => {
  const orders = await orderRepository.findAll();
  return orders;
};

export const getOrderById = async (orderId: string) => {
  return orderRepository.findById(orderId);
};
