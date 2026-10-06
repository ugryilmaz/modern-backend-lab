import pLimit from 'p-limit';

export const createOrderBulkhead = () => {
  return pLimit({
    concurrency: 5,
  });
};
