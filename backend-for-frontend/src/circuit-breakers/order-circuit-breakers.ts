import type { FastifyBaseLogger } from 'fastify';
import CircuitBreaker from 'opossum';

const fetchOrders = async () => {
  const response = await fetch('http://localhost:3002/orders');

  if (!response.ok) {
    throw new Error(`Order Service returned ${response.status}`);
  }

  return response.json();
};

export const createOrderCircuitBreaker = (logger: FastifyBaseLogger) => {
  const breaker = new CircuitBreaker(fetchOrders, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000,
    volumeThreshold: 3,
  });

  breaker.on('failure', (error) => {
    logger.error(
      {
        dependency: 'order-service',
        err: error,
      },
      'Order Service request failed',
    );
  });

  breaker.on('timeout', () => {
    logger.warn(
      {
        dependency: 'order-service',
      },
      'Order Service request timed out',
    );
  });

  breaker.on('reject', () => {
    logger.warn(
      {
        dependency: 'order-service',
      },
      'Order Service request rejected because circuit is open',
    );
  });

  breaker.on('open', () => {
    logger.error(
      {
        dependency: 'order-service',
      },
      'Order Service circuit opened',
    );
  });

  breaker.on('halfOpen', () => {
    logger.info(
      {
        dependency: 'order-service',
      },
      'Order Service circuit half-open',
    );
  });

  breaker.on('close', () => {
    logger.info(
      {
        dependency: 'order-service',
      },
      'Order Service circuit closed',
    );
  });

  return breaker;
};
