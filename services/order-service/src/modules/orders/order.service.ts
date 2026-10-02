import orderRepository from './order.repository.js';

const getOrders = async () => {
  const orders = await orderRepository.findAll();
  return orders;
};

export default { getOrders };
