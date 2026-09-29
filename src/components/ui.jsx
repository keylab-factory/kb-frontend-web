import { AlertIcon, MinusIcon, PlusIcon, StarIcon } from './icons.jsx';

export function Stars({ rating, reviews, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 text-sm ${className}`}>
      <div className="flex text-amber-400" aria-label={`${rating} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} filled={rating >= n - 0.25} className="h-3.5 w-3.5" />
        ))}
      </div>
      <span className="text-tone-400">
        {rating.toFixed(1)}
        {reviews !== undefined && <span className="text-tone-500"> ({reviews})</span>}
      </span>
    </div>
  );
}

export function QuantityInput({ value, onChange, max = 99, size = 'md' }) {
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center rounded-xl border border-tone-700 bg-tone-900">
      <button type="button" className={`${btn} flex items-center justify-center text-tone-300 hover:text-tone-50 disabled:opacity-30`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Quitar uno">
        <MinusIcon className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" className={`${btn} flex items-center justify-center text-tone-300 hover:text-tone-50 disabled:opacity-30`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Agregar uno">
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function StockBadge({ stock }) {
  if (stock <= 0) return <span className="chip border-red-500/30 bg-red-500/10 text-red-300">Agotado</span>;
  if (stock <= 5) return <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300">Últimas {stock} unidades</span>;
  return <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">En stock</span>;
}

// El estado siempre va con su texto, no solo con el color
const ORDER_STATUS = {
  confirmado: { label: 'Confirmado', className: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  enviado: { label: 'Enviado', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  entregado: { label: 'Entregado', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  cancelado: { label: 'Cancelado', className: 'border-red-500/30 bg-red-500/10 text-red-300' },
};

export function OrderStatusBadge({ status }) {
  const s = ORDER_STATUS[status] ?? { label: status, className: 'border-tone-700 text-tone-300' };
  return <span className={`chip ${s.className}`}>{s.label}</span>;
}

export function ErrorState({ error, onRetry, title = 'Algo salió mal' }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <AlertIcon />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-tone-400">{error?.message ?? String(error)}</p>
      {error?.data?.hint && <code className="mt-3 rounded-lg bg-tone-800 px-3 py-1.5 text-xs text-tone-300">{error.data.hint}</code>}
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-6" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-tone-400">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-tone-800/50" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-tone-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-tone-800" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-tone-800" />
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, children, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {children && <p className="mt-2 max-w-2xl text-tone-400">{children}</p>}
      </div>
      {action}
    </div>
  );
}
