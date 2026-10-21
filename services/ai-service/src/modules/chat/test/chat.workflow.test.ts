import assert from 'node:assert/strict';
import test from 'node:test';
import { runOrderWorkflow } from '../chat.workflow.js';

test('sipariş durumu workflow sonucu doğru biçimlendirir', async () => {
  const result = await runOrderWorkflow({
    intent: 'order_status',
    orderId: 'ORD-1001',
    userId: 1,
  });

  assert.equal(
    result,
    'ORD-1001 numaralı siparişinizin durumu "kargoya verildi". Kargo şirketi Yurtiçi Kargo.',
  );
});

test('teslimat workflow tahmini teslim tarihini döndürür', async () => {
  const result = await runOrderWorkflow({
    intent: 'delivery_estimate',
    orderId: 'ORD-1001',
    userId: 1,
  });

  assert.equal(
    result,
    'ORD-1001 numaralı sipariş için tahmini teslim tarihi 2026-10-15.',
  );
});

test('repair durumundaki sipariş için teslimat bilgisi de alınır', async () => {
  const result = await runOrderWorkflow({
    intent: 'order_status',
    orderId: 'ORD-1002',
    userId: 1,
  });

  assert.equal(
    result,
    'ORD-1002 numaralı siparişinizin durumu "tamir sürecinde". Kargo şirketi MNG Kargo. Tahmini teslim tarihi 2026-10-20.',
  );
});

test('başka kullanıcıya ait siparişin bilgilerini göstermez', async () => {
  const result = await runOrderWorkflow({
    intent: 'order_status',
    orderId: 'ORD-1003',
    userId: 1,
  });

  assert.equal(result, 'ORD-1003 numaralı sipariş için bir kayıt bulunamadı.');
});

test('önceden iptal edilmiş workflow devam etmez', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Test cancellation'));

  await assert.rejects(
    runOrderWorkflow({
      intent: 'order_status',
      orderId: 'ORD-1001',
      userId: 1,
      abortSignal: controller.signal,
    }),
    /Test cancellation/,
  );
});
