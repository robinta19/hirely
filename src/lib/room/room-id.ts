import { randomBytes } from 'crypto';

export function generateRoomId(): string {
  // Generate 10-character alphanumeric cryptographically secure random string
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = randomBytes(10);
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}
