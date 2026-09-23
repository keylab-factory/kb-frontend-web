function parse(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (channels) => '#' + channels.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');

/** Aclara (amount > 0) u oscurece (amount < 0) un color hex. amount va de -1 a 1. */
export function shade(hex, amount) {
  const target = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return toHex(parse(hex).map((c) => c + (target - c) * p));
}

/** Luminancia relativa (WCAG) entre 0 y 1. */
export function luminance(hex) {
  const [r, g, b] = parse(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const readableOn = (hex) => (luminance(hex) > 0.4 ? '#18181b' : '#f4f4f5');
