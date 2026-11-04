import { describe, it, expect } from 'vitest';
import { chatCode, chatBody } from './chat';
describe('private chat input rules', () => {
  it('requires an exact six digit ID', () => {
    expect(chatCode.safeParse('123456').success).toBe(true);
    for (const value of ['12345', '1234567', 'abc123', '123 56']) expect(chatCode.safeParse(value).success).toBe(false);
  });
  it('accepts text and rejects empty or oversized messages', () => {
    expect(chatBody.parse(' مرحبًا ')).toBe('مرحبًا');
    expect(chatBody.safeParse('   ').success).toBe(false);
    expect(chatBody.safeParse('x'.repeat(4001)).success).toBe(false);
  });
});