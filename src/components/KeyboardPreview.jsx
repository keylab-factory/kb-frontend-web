import { memo, useId } from 'react';
import { buildLayout } from '../data/layouts.js';
import { shade, readableOn } from '../utils/color.js';

const U = 40; // tamaño de 1u en unidades del SVG
const PAD = 0.5; // borde del case alrededor de las teclas, en u
const KEY_GAP = 0.08;

const DEFAULT_COLORS = { alpha: '#e4e4e7', mod: '#71717a', accent: '#f97316', highlight: '#ef4444' };

function Keycap({ k, colors, legends, marked, dimmed }) {
  const x = (k.x + PAD + KEY_GAP / 2) * U;
  const y = (k.y + PAD + KEY_GAP / 2) * U;
  const w = (k.w - KEY_GAP) * U;
  const h = (k.h - KEY_GAP) * U;
  const base = marked ? colors.highlight : (k.kind === 'space' ? colors.space : colors[k.kind]) ?? colors.alpha;
  const inset = U * 0.1;
  const legendColor = k.kind === 'alpha' || k.kind === 'space' ? colors.legend : colors.modLegend;

  return (
    <g opacity={dimmed ? 0.35 : 1}>
      <rect x={x} y={y} width={w} height={h} rx={U * 0.13} fill={shade(base, -0.28)} />
      <rect x={x + inset} y={y + inset * 0.45} width={w - inset * 2} height={h - inset * 1.9} rx={U * 0.1} fill={base} />
      {legends && k.label && (
        <text
          x={x + inset + U * 0.09}
          y={y + inset * 0.45 + U * (k.label.length > 2 ? 0.3 : 0.36)}
          fontSize={k.label.length > 2 ? U * 0.2 : U * 0.28}
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          fill={legendColor ?? readableOn(base)}
        >
          {k.label}
        </text>
      )}
    </g>
  );
}

// Vista sin keycaps: se ven los switches montados sobre la plate
function SwitchSlot({ k, caseColor, switchColor }) {
  const cx = (k.x + PAD + k.w / 2) * U;
  const cy = (k.y + PAD + 0.5) * U;
  const s = U * 0.66;
  return (
    <g>
      <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={U * 0.08} fill={shade(caseColor, -0.45)} opacity="0.85" />
      {switchColor && (
        <>
          <rect x={cx - U * 0.05} y={cy - U * 0.17} width={U * 0.1} height={U * 0.34} rx={U * 0.02} fill={switchColor} />
          <rect x={cx - U * 0.17} y={cy - U * 0.05} width={U * 0.34} height={U * 0.1} rx={U * 0.02} fill={switchColor} />
        </>
      )}
    </g>
  );
}

/**
 * Dibuja un teclado en SVG a partir del layout y la paleta de colores.
 * Si no hay keycaps (`blank`), muestra la plate con los switches.
 * `highlight` (Set de índices de teclas) pinta esas teclas con `colors.highlight`
 * y atenúa las demás: sirve para mostrar qué se pierde al cambiar de layout.
 */
function KeyboardPreview({ layout = '65%', caseColor = '#3f3f46', colors, blank = false, switchColor, legends = false, highlight, className = '', title }) {
  const gradientId = `case-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const geo = buildLayout(layout);
  const width = (geo.width + PAD * 2) * U;
  const height = (geo.height + PAD * 2) * U;
  const palette = { ...DEFAULT_COLORS, ...colors };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={title ?? `Teclado ${geo.id}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(caseColor, 0.12)} />
          <stop offset="1" stopColor={shade(caseColor, -0.12)} />
        </linearGradient>
      </defs>
      <rect x="0" y={U * 0.12} width={width} height={height} rx={U * 0.42} fill={shade(caseColor, -0.4)} opacity="0.6" />
      <rect x="0" y="0" width={width} height={height - U * 0.06} rx={U * 0.42} fill={`url(#${gradientId})`} />
      <rect
        x={PAD * U * 0.55}
        y={PAD * U * 0.55}
        width={width - PAD * U * 1.1}
        height={height - PAD * U * 1.1 - U * 0.06}
        rx={U * 0.22}
        fill={shade(caseColor, -0.3)}
        opacity="0.55"
      />
      {geo.keys.map((key, i) =>
        blank ? (
          <SwitchSlot key={i} k={key} caseColor={caseColor} switchColor={switchColor} />
        ) : (
          <Keycap key={i} k={key} colors={palette} legends={legends} marked={highlight?.has(i)} dimmed={highlight?.size > 0 && !highlight.has(i)} />
        ),
      )}
    </svg>
  );
}

export default memo(KeyboardPreview);
