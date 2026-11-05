import { describe, it, expect } from 'vitest';
import { chatCode, chatBody } from './chat-schema';
import { CHAT_RETENTION_MS, messageIsLive, becameOnline } from './chat-retention';
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
describe('chat lifetime and online alerts', () => {
  it('expires exactly three days after sending', () => {
    expect(CHAT_RETENTION_MS).toBe(259200000);
    const sent = '2026-11-05T00:00:00Z';
    expect(messageIsLive(sent, Date.parse('2026-11-07T23:59:59Z'))).toBe(true);
    expect(messageIsLive(sent, Date.parse('2026-11-08T00:00:00Z'))).toBe(false);
  });
  it('alerts once on offline to online, not on initial load or heartbeat', () => {
    expect(becameOnline(undefined, true)).toBe(false);
    expect(becameOnline(false, true)).toBe(true);
    expect(becameOnline(true, true)).toBe(false);
    expect(becameOnline(true, false)).toBe(false);
  });
});