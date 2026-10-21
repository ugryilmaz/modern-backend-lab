import { chatInstructionRules } from './chat.instructions.js';

const normalize = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .trim();

const normalizedRules = chatInstructionRules.map(normalize);

export const containsInstructionLeak = (response: string): boolean => {
  const normalizedResponse = normalize(response);

  return normalizedRules.some((rule) => normalizedResponse.includes(rule));
};
