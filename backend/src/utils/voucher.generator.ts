import crypto from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0,O,1,I)

export function generateVoucherCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('');
}

export function generateBulkCodes(count: number, length = 8): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateVoucherCode(length));
  }
  return [...codes];
}
