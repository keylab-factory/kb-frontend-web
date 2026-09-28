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

const n = (label, w = 1) => ({ label, w, kind: 'alpha' }); // tecla del pad numérico
const NUMPAD_TOP = [m('Num'), m('/'), m('*'), m('-')];

const LAYOUTS = {
  // 13u de ancho, sin fila de números: números y símbolos viven en capas
  '40%': {
    rows: [
      [m('Tab'), ...alphas('QWERTYUIOP'), m('Del'), m('⌫')],
      [a('Esc', 1.25), ...alphas("ASDFGHJKL'"), a('Enter', 1.75)],
      [m('Shift', 2), ...alphas('ZXCVBNM,.'), m('↑'), m('/')],
      [m('Ctrl'), m('Win'), m('Alt'), m('Fn'), space(2.25), space(2.75), m('Fn'), m('←'), m('↓'), m('→')],
    ],
  },
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
  // 1800 compacto: todo el full-size, con el pad numérico pegado y sin espacios entre bloques
  '96%': {
    rows: [
      [a('Esc'), ...fKeys(1, 4, m), ...fKeys(5, 8, k), ...fKeys(9, 12, m), m('Del'), m('Ins'), m('Home'), m('End'), m('PgUp'), m('PgDn')],
      [k('`'), ...alphas('1234567890-='), m('⌫', 2), ...NUMPAD_TOP],
      [...ROW_TAB, n('7'), n('8'), n('9'), m('+')],
      [...ROW_CAPS, n('4'), n('5'), n('6')],
      [m('Shift', 2.25), ...alphas('ZXCVBNM,./'), m('Shift', 1.75), m('↑'), n('1'), n('2'), n('3'), a('Ent')],
      [m('Ctrl', 1.25), m('Win', 1.25), m('Alt', 1.25), space(6.25), m('Alt'), m('Fn'), m('Ctrl'), m('←'), m('↓'), m('→'), n('0'), m('.')],
    ],
  },
  // Full-size: el TKL completo más el pad numérico separado
  '100%': {
    rowGaps: { 1: 0.5 },
    rows: [
      [a('Esc'), gap(1), ...fKeys(1, 4, m), gap(0.5), ...fKeys(5, 8, k), gap(0.5), ...fKeys(9, 12, m), gap(0.25), m('PrtSc'), m('ScrLk'), m('Pause')],
      [k('`'), ...alphas('1234567890-='), m('⌫', 2), gap(0.25), m('Ins'), m('Home'), m('PgUp'), gap(0.25), ...NUMPAD_TOP],
      [...ROW_TAB, gap(0.25), m('Del'), m('End'), m('PgDn'), gap(0.25), n('7'), n('8'), n('9'), m('+')],
      [...ROW_CAPS, gap(3.5), n('4'), n('5'), n('6')],
      [...ROW_SHIFT_60, gap(1.25), m('↑'), gap(1.25), n('1'), n('2'), n('3'), a('Ent')],
      [...ROW_MODS_60, gap(0.25), m('←'), m('↓'), m('→'), gap(0.25), n('0', 2), m('.')],
    ],
  },
};

// De menor a mayor, el mismo orden que devuelve la API
export const LAYOUT_IDS = ['40%', '60%', '65%', '75%', 'TKL', '96%', '100%'];

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

/**
 * Índices de las teclas de `from` que no existen en `to`: lo que se pierde al
 * pasar a un layout más pequeño. Se compara por etiqueta contando repeticiones
 * (hay dos Shift, dos Ctrl, el "1" de la fila de números y el del pad...), y se
 * recorre de izquierda a derecha para que el bloque principal "gane" frente al pad.
 */
export function removedKeys(from, to) {
  const remaining = new Map();
  for (const key of buildLayout(to).keys) remaining.set(key.label, (remaining.get(key.label) ?? 0) + 1);
  const removed = new Set();
  const keys = buildLayout(from).keys;
  const order = keys.map((_, i) => i).sort((a, b) => keys[a].x - keys[b].x || keys[a].y - keys[b].y);
  for (const i of order) {
    const left = remaining.get(keys[i].label) ?? 0;
    if (left > 0) remaining.set(keys[i].label, left - 1);
    else removed.add(i);
  }
  return removed;
}
