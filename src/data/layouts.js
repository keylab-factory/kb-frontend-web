// Geometría de los layouts ANSI en unidades de tecla (1u = una tecla normal).
// kind decide el color: alpha (letras), mod (modificadores), accent (Esc/Enter), space.

const k = (label, w = 1) => ({ label, w, kind: 'alpha' });
const m = (label, w = 1) => ({ label, w, kind: 'mod' });
const a = (label, w = 1) => ({ label, w, kind: 'accent' });
const space = (w) => ({ label: '', w, kind: 'space' });
const gap = (w) => ({ gap: w });
const alphas = (chars) => [...chars].map((c) => k(c));
const fKeys = (from, to, make) => Array.from({ length: to - from + 1 }, (_, i) => make(`F${from + i}`));

const ROW_TAB = [m('Tab', 1.5), ...alphas('QWERTYUIOP[]'), m('\\', 1.5)];
const ROW_CAPS = [m('Caps', 1.75), ...alphas("ASDFGHJKL;'"), a('Enter', 2.25)];
const ROW_SHIFT_60 = [m('Shift', 2.25), ...alphas('ZXCVBNM,./'), m('Shift', 2.75)];
const ROW_SHIFT_65 = [m('Shift', 2.25), ...alphas('ZXCVBNM,./'), m('Shift', 1.75), m('↑'), m('End')];
const ROW_MODS_60 = [m('Ctrl', 1.25), m('Win', 1.25), m('Alt', 1.25), space(6.25), m('Alt', 1.25), m('Win', 1.25), m('Fn', 1.25), m('Ctrl', 1.25)];
const ROW_MODS_65 = [m('Ctrl', 1.25), m('Win', 1.25), m('Alt', 1.25), space(6.25), m('Alt'), m('Fn'), m('Ctrl'), m('←'), m('↓'), m('→')];

const LAYOUTS = {
  '60%': {
    rows: [[a('Esc'), ...alphas('1234567890-='), m('⌫', 2)], ROW_TAB, ROW_CAPS, ROW_SHIFT_60, ROW_MODS_60],
  },
  '65%': {
    rows: [
      [a('Esc'), ...alphas('1234567890-='), m('⌫', 2), m('Del')],
      [...ROW_TAB, m('PgUp')],
      [...ROW_CAPS, m('PgDn')],
      ROW_SHIFT_65,
      ROW_MODS_65,
    ],
  },
  '75%': {
    rowGaps: { 1: 0.25 },
    rows: [
      [a('Esc'), ...fKeys(1, 4, m), ...fKeys(5, 8, k), ...fKeys(9, 12, m), m('PrtSc'), m('Ins'), m('Del')],
      [k('`'), ...alphas('1234567890-='), m('⌫', 2), m('Home')],
      [...ROW_TAB, m('PgUp')],
      [...ROW_CAPS, m('PgDn')],
      ROW_SHIFT_65,
      ROW_MODS_65,
    ],
  },
  TKL: {
    rowGaps: { 1: 0.5 },
    rows: [
      [a('Esc'), gap(1), ...fKeys(1, 4, m), gap(0.5), ...fKeys(5, 8, k), gap(0.5), ...fKeys(9, 12, m), gap(0.25), m('PrtSc'), m('ScrLk'), m('Pause')],
      [k('`'), ...alphas('1234567890-='), m('⌫', 2), gap(0.25), m('Ins'), m('Home'), m('PgUp')],
      [...ROW_TAB, gap(0.25), m('Del'), m('End'), m('PgDn')],
      ROW_CAPS,
      [...ROW_SHIFT_60, gap(1.25), m('↑')],
      [...ROW_MODS_60, gap(0.25), m('←'), m('↓'), m('→')],
    ],
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

const cache = new Map();

/** Devuelve las teclas con posición absoluta (x, y en unidades) y el tamaño total. */
export function buildLayout(id) {
  const layoutId = LAYOUTS[id] ? id : '65%';
  if (cache.has(layoutId)) return cache.get(layoutId);

  const { rows, rowGaps = {} } = LAYOUTS[layoutId];
  const keys = [];
  let y = 0;
  let width = 0;
  rows.forEach((row, index) => {
    y += rowGaps[index] ?? 0;
    let x = 0;
    for (const item of row) {
      if (item.gap) {
        x += item.gap;
        continue;
      }
      keys.push({ ...item, x, y, h: 1 });
      x += item.w;
    }
    width = Math.max(width, x);
    y += 1;
  });

  const geometry = { id: layoutId, keys, width, height: y, keyCount: keys.length };
  cache.set(layoutId, geometry);
  return geometry;
}
