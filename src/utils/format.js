const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' });

export const formatCOP = (value) => cop.format(value);

export function formatUSD(value, digits = 2) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export const formatDate = (iso) => dateFmt.format(new Date(iso));

// "2026-09-23" -> "23 sep 2026" (se interpreta como fecha local, sin corrimiento por zona horaria)
const shortDateFmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
export function formatShortDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return shortDateFmt.format(new Date(y, m - 1, d));
}

export function timeAgo(iso) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
