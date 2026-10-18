import assert from 'node:assert/strict';
import test from 'node:test';
import type { ModelMessage } from 'ai';
import { selectSlidingWindow, splitMessagesForSummary } from './ai.context.js';

const messages: ModelMessage[] = [
  { role: 'user', content: 'Mesaj 1' },
  { role: 'assistant', content: 'Yanıt 1' },
  { role: 'user', content: 'Mesaj 2' },
  { role: 'assistant', content: 'Yanıt 2' },
  { role: 'user', content: 'Mesaj 3' },
];

test('son N mesajı seçer ve sıralamayı korur', () => {
  const result = selectSlidingWindow(messages, 3);

  assert.deepEqual(result, [
    { role: 'user', content: 'Mesaj 2' },
    { role: 'assistant', content: 'Yanıt 2' },
    { role: 'user', content: 'Mesaj 3' },
  ]);

  assert.equal(messages.length, 5);
});

test('geçmiş sınırdan kısaysa tüm mesajları korur', () => {
  const result = selectSlidingWindow(messages, 10);

  assert.deepEqual(result, messages);
});

test('limit sıfırsa boş dizi döndürür', () => {
  assert.deepEqual(selectSlidingWindow(messages, 0), []);
});

test('geçersiz limitleri reddeder', () => {
  assert.throws(() => selectSlidingWindow(messages, -1), RangeError);

  assert.throws(() => selectSlidingWindow(messages, 1.5), RangeError);
});

test('eski mesajları ve yakın geçmişi doğru ayırır', () => {
  const { messagesToSummarize, recentMessages } = splitMessagesForSummary(
    messages,
    2,
  );

  assert.deepEqual(messagesToSummarize, messages.slice(0, 3));
  assert.deepEqual(recentMessages, messages.slice(-2));
});

test('geçmiş kısaysa bütün mesajları yakın geçmişte korur', () => {
  const { messagesToSummarize, recentMessages } = splitMessagesForSummary(
    messages,
    10,
  );

  assert.deepEqual(messagesToSummarize, []);
  assert.deepEqual(recentMessages, messages);
});

test('geçersiz yakın geçmiş limitini reddeder', () => {
  assert.throws(() => splitMessagesForSummary(messages, 0), RangeError);
  assert.throws(() => splitMessagesForSummary(messages, -1), RangeError);
  assert.throws(() => splitMessagesForSummary(messages, 1.5), RangeError);
});
