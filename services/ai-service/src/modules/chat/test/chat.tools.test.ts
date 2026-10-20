import assert from 'node:assert/strict';
import test from 'node:test';
import { getEstimatedDelivery, getOrderStatus } from '../chat.tools.js';

test('sipariş sahibi sipariş durumunu görebilir', async () => {
  const result = await getOrderStatus('ORD-1001', 1);

  assert.deepEqual(result, {
    orderId: 'ORD-1001',
    status: 'shipped',
    carrier: 'Yurtiçi Kargo',
    estimatedDelivery: '2026-10-15',
  });
});

test('başka bir kullanıcının siparişi bulunamadı olarak döner', async () => {
  const result = await getOrderStatus('ORD-1003', 1);

  assert.deepEqual(result, {
    orderId: 'ORD-1003',
    status: 'not_found',
  });
});

test('sipariş sahibi tahmini teslim tarihini görebilir', async () => {
  const result = await getEstimatedDelivery('ORD-1002', 1);

  assert.deepEqual(result, {
    orderId: 'ORD-1002',
    estimatedDelivery: '2026-10-20',
  });
});
