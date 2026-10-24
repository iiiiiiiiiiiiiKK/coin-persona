/** 确定性 PRNG 与种子工具：同一 seed 永远生成同一套题、同一顺序。 */

/** FNV-1a 32 位哈希，把任意字符串变成 uint32。 */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32：小巧、可复现的 32 位 PRNG。 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 原地 Fisher–Yates 洗牌。 */
export function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickOne<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** 生成一个 4-4 的题码，例如 7K2M-9QX4。 */
export function makeSeed(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

/** 题码规范化：大写、去掉空格与非字母数字、补回中间连字符。 */
export function normalizeSeed(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 8);
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

export function isValidSeed(raw: string): boolean {
  return /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(normalizeSeed(raw));
}

/** 报告 id：seed + 作答内容的稳定短哈希。 */
export function makeReportId(seed: string, answers: Record<string, number>): string {
  const keys = Object.keys(answers).sort();
  const material = `${seed}|${keys.map((k) => `${k}:${answers[k]}`).join(',')}`;
  return hashSeed(material).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}
