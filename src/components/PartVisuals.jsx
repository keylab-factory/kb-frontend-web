import { memo } from 'react';
import { buildLayout } from '../data/layouts.js';
import { shade } from '../utils/color.js';

const U = 40;
const PAD = 0.45;

/** Switch MX visto desde arriba: housing inferior, superior translúcido y stem en cruz. */
export const SwitchVisual = memo(function SwitchVisual({ stem = '#f97316', top = '#e4e4e7', bottom = '#e4e4e7', className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Switch mecánico">
      <rect x="14" y="22" width="92" height="88" rx="16" fill={shade(bottom, -0.35)} />
      <rect x="14" y="16" width="92" height="88" rx="16" fill={bottom} />
      <rect x="22" y="12" width="76" height="76" rx="13" fill={shade(top, -0.15)} />
      <rect x="22" y="10" width="76" height="72" rx="13" fill={top} opacity="0.92" />
      <rect x="52" y="24" width="16" height="44" rx="4" fill={stem} />
      <rect x="38" y="38" width="44" height="16" rx="4" fill={stem} />
      <rect x="54" y="26" width="5" height="40" rx="2" fill="#fff" opacity="0.25" />
      <rect x="48" y="90" width="24" height="7" rx="2" fill={shade(bottom, -0.25)} />
    </svg>
  );
});

/** Plate o PCB dibujada con los cortes / sockets del layout. */
export const BoardVisual = memo(function BoardVisual({ layout = '65%', color = '#b8bcc4', type = 'plate', className = '' }) {
  const geo = buildLayout(layout);
  const width = (geo.width + PAD * 2) * U;
  const height = (geo.height + PAD * 2) * U;
  const isPcb = type === 'pcb';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={isPcb ? `PCB ${geo.id}` : `Plate ${geo.id}`}>
      <rect x="0" y={U * 0.1} width={width} height={height} rx={U * 0.3} fill={shade(color, -0.35)} />
      <rect x="0" y="0" width={width} height={height - U * 0.05} rx={U * 0.3} fill={color} />
      {isPcb && (
        <>
          <rect x={width / 2 - U * 0.5} y={-U * 0.05} width={U} height={U * 0.35} rx={U * 0.06} fill="#a1a1aa" />
          <rect x={width * 0.42} y={height * 0.52} width={U * 0.9} height={U * 0.9} rx={U * 0.06} fill="#0a0a0a" opacity="0.85" />
        </>
      )}
      {geo.keys.map((k, i) => {
        const cx = (k.x + PAD + k.w / 2) * U;
        const cy = (k.y + PAD + 0.5) * U;
        if (isPcb) {
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={U * 0.1} fill={shade(color, -0.5)} />
              <circle cx={cx - U * 0.19} cy={cy - U * 0.2} r={U * 0.07} fill="#d4a53c" />
              <circle cx={cx + U * 0.13} cy={cy - U * 0.25} r={U * 0.07} fill="#d4a53c" />
            </g>
          );
        }
        const s = U * 0.7;
        return <rect key={i} x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={U * 0.04} fill="#09090b" opacity="0.88" />;
      })}
    </svg>
  );
});

/** Estabilizador: dos housings unidos por el alambre. */
export const StabVisual = memo(function StabVisual({ housing = '#1f1f23', wire = '#c7c7cc', className = '' }) {
  return (
    <svg viewBox="0 0 200 110" className={className} role="img" aria-label="Estabilizador">
      <path d="M 40 80 L 40 92 L 160 92 L 160 80" fill="none" stroke={wire} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {[40, 160].map((x) => (
        <g key={x}>
          <rect x={x - 22} y="26" width="44" height="58" rx="9" fill={shade(housing, -0.3)} />
          <rect x={x - 22} y="22" width="44" height="56" rx="9" fill={housing} />
          <rect x={x - 8} y="10" width="16" height="36" rx="4" fill={shade(housing, 0.35)} />
        </g>
      ))}
    </svg>
  );
});
