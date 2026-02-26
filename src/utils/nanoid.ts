/** Tiny nanoid for generating unique IDs without the npm package */
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function nanoid(length = 10): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, byte => chars[byte % chars.length]).join('');
}
