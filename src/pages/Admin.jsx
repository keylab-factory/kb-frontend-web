import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { useSession } from '../auth/session.js';
import { useApi } from '../hooks/useApi.js';
import { EmptyState, ErrorState, OrderStatusBadge } from '../components/ui.jsx';
import { AlertIcon, ExternalIcon, SearchIcon } from '../components/icons.jsx';
import { CATEGORY_LABELS, categoryLabel } from '../data/categories.js';
import { formatCOP, formatDate } from '../utils/format.js';

/**
 * Panel de administración: revisar y publicar los productos que importa la app
 * de escritorio, ajustar precio y stock, y llevar los pedidos hasta la entrega.
 * La página solo se muestra a quien tiene el rol admin, pero la protección real
 * está en el backend: cada llamada verifica el rol en el token.
 */

const PRODUCT_TABS = [
  { id: 'draft', label: 'Borradores' },
  { id: 'published', label: 'Publicados' },
  { id: 'archived', label: 'Archivados' },
];
const ORDER_TABS = [
  { id: 'pendiente_pago', label: 'Pago pendiente' },
  { id: 'confirmado', label: 'Por enviar' },
  { id: 'enviado', label: 'Enviados' },
  { id: 'entregado', label: 'Entregados' },
  { id: 'cancelado', label: 'Cancelados' },
];

// Estado del cobro en línea (Wompi), con el color que ayuda a leerlo de un vistazo
const PAYMENT_LABELS = {
  aprobado: ['Pagado en línea', 'text-emerald-300'],
  pendiente: ['Esperando pago', 'text-amber-300'],
  rechazado: ['Pago rechazado', 'text-red-300'],
  vencido: ['Venció sin pagar', 'text-tone-400'],
};

// Espera a que se deje de escribir antes de buscar
function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function Pills({ tabs, value, counts, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-pressed={value === t.id}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === t.id ? 'border-brand-500 bg-brand-500/10 text-tone-50' : 'border-tone-800 text-tone-400 hover:border-tone-600 hover:text-tone-200'
          }`}
        >
          {t.label}
          {counts && <span className="ml-1.5 tabular-nums text-tone-500">{counts[t.id] ?? 0}</span>}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ id, value, onChange, placeholder }) {
  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        Buscar
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tone-500" />
      <input id={id} type="search" className="input pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const RowError = ({ message }) =>
  message ? (
    <p role="alert" className="mt-3 flex gap-2 text-sm text-red-300">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  ) : null;

// ---------- Productos ----------

const toInt = (s) => (/^\d+$/.test(String(s).trim()) ? Number(s) : NaN);

function ProductRow({ product, onChanged }) {
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dirty = price !== String(product.price) || stock !== String(product.stock);

  async function save(extra = {}) {
    const p = toInt(price);
    const s = toInt(stock);
    if (Number.isNaN(p) || Number.isNaN(s)) return setError('Precio y stock deben ser números enteros, sin puntos ni signos.');
    setBusy(true);
    setError(null);
    try {
      await api.adminUpdateProduct(product.id, { price: p, stock: s, ...extra });
      onChanged();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const archive = () => save({ status: 'archived' });
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{product.name}</p>
          <p className="mt-0.5 text-sm text-tone-400">
            {product.brand} · {categoryLabel(product.category)}
            {product.layout && ` · ${product.layout}`}
          </p>
          <p className="mt-0.5 font-mono text-xs text-tone-500">{product.id}</p>
        </div>
        {product.sourceUrl && (
          <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
            Ver en la tienda de origen <ExternalIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {product.specs?.['Precio de referencia'] && <p className="mt-2 text-xs text-tone-500">Referencia: {product.specs['Precio de referencia']}</p>}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label htmlFor={`price-${product.id}`} className="label">
            Precio (COP)
          </label>
          <input id={`price-${product.id}`} inputMode="numeric" className="input tabular-nums" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="w-24">
          <label htmlFor={`stock-${product.id}`} className="label">
            Stock
          </label>
          <input id={`stock-${product.id}`} inputMode="numeric" className="input tabular-nums" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <p className="pb-2.5 text-sm text-tone-400 tabular-nums">{Number.isNaN(toInt(price)) ? '—' : formatCOP(toInt(price))}</p>
        <div className="ml-auto flex flex-wrap gap-2">
          {dirty && (
            <button type="button" className="btn btn-secondary text-sm" disabled={busy} onClick={() => save()}>
              Guardar
            </button>
          )}
          {product.status !== 'published' && (
            <button type="button" className="btn btn-primary text-sm" disabled={busy} onClick={() => save({ status: 'published' })}>
              Publicar
            </button>
          )}
          {product.status === 'archived' && (
            <button type="button" className="btn btn-ghost text-sm" disabled={busy} onClick={() => save({ status: 'draft' })}>
              Pasar a borrador
            </button>
          )}
          {product.status !== 'archived' && (
            <button type="button" className="btn btn-ghost text-sm" disabled={busy} onClick={archive}>
              Archivar
            </button>
          )}
        </div>
      </div>
      <RowError message={error} />
    </li>
  );
}

function ProductsPanel() {
  const [status, setStatus] = useState('draft');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useApi(() => api.adminProducts({ status, category, q }), [status, category, q]);

  return (
    <div className="space-y-5">
      <Pills tabs={PRODUCT_TABS} value={status} counts={data?.counts} onChange={setStatus} label="Estado de los productos" />
      <div className="flex flex-wrap gap-3">
        <SearchBox id="admin-product-search" value={search} onChange={setSearch} placeholder="Nombre, marca o id" />
        <label htmlFor="admin-category" className="sr-only">
          Categoría
        </label>
        <select id="admin-category" className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {status === 'draft' && (
        <p className="text-sm text-tone-400">
          Los borradores los crea la app de escritorio con un precio sugerido (dólar del día más margen) y stock 0. No aparecen en la tienda hasta publicarlos.
        </p>
      )}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <div className="card h-40 animate-pulse" />
      ) : data.items.length === 0 ? (
        <EmptyState title={q || category ? 'Nada coincide con la búsqueda' : 'No hay productos en este estado'} />
      ) : (
        <ul className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* La clave incluye precio y stock: tras guardar, la fila arranca con los valores nuevos */}
          {data.items.map((p) => (
            <ProductRow key={`${p.id}:${p.price}:${p.stock}:${p.status}`} product={p} onChanged={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Pedidos ----------

function OrderRow({ order, allowed, onChanged }) {
  const [tracking, setTracking] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);

  async function move(status) {
    setBusy(true);
    setError(null);
    try {
      await api.adminUpdateOrder(order.id, { status, ...(status === 'enviado' && { trackingCode: tracking }) });
      onChanged();
    } catch (err) {
      setError(err.data?.details?.trackingCode ? 'Escribe el número de guía antes de marcarlo como enviado.' : err.message);
      setBusy(false);
    }
  }

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <Link to={`/pedido/${order.id}`} className="font-mono text-sm font-semibold hover:text-brand-300">
              {order.id}
            </Link>
            <OrderStatusBadge status={order.status} />
          </p>
          <p className="mt-1 text-sm text-tone-400">{formatDate(order.createdAt)}</p>
        </div>
        <p className="text-right">
          <span className="block font-bold tabular-nums">{formatCOP(order.total)}</span>
          <span className="text-xs text-tone-500">
            {order.paymentLabel} · {units} {units === 1 ? 'unidad' : 'unidades'}
          </span>
          {PAYMENT_LABELS[order.paymentStatus] && <span className={`block text-xs font-medium ${PAYMENT_LABELS[order.paymentStatus][1]}`}>{PAYMENT_LABELS[order.paymentStatus][0]}</span>}
        </p>
      </div>

      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-tone-200">{order.customer.name}</p>
          <p className="text-tone-400">
            {order.customer.email} · {order.customer.phone}
          </p>
          <p className="text-tone-400">
            {order.customer.address}, {order.customer.city}
          </p>
        </div>
        <ul className="text-tone-300">
          {order.items.map((i) => (
            <li key={i.productId}>
              {i.quantity} × {i.name}
            </li>
          ))}
        </ul>
      </div>
      {order.trackingCode && (
        <p className="mt-2 text-sm text-tone-400">
          Guía: <span className="font-mono text-tone-200">{order.trackingCode}</span>
        </p>
      )}

      {allowed.length > 0 && (
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-tone-800 pt-4">
          {allowed.includes('enviado') && (
            <>
              <div className="w-56">
                <label htmlFor={`tracking-${order.id}`} className="label">
                  Número de guía
                </label>
                <input id={`tracking-${order.id}`} className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </div>
              <button type="button" className="btn btn-primary text-sm" disabled={busy || !tracking.trim()} onClick={() => move('enviado')}>
                Marcar como enviado
              </button>
            </>
          )}
          {allowed.includes('entregado') && (
            <button type="button" className="btn btn-primary text-sm" disabled={busy} onClick={() => move('entregado')}>
              Marcar como entregado
            </button>
          )}
          {allowed.includes('cancelado') &&
            (confirmCancel ? (
              <span className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-tone-300">¿Cancelar y devolver el stock?</span>
                <button type="button" className="btn btn-secondary text-sm text-red-300" disabled={busy} onClick={() => move('cancelado')}>
                  Sí, cancelar
                </button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setConfirmCancel(false)}>
                  No
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost ml-auto text-sm text-red-300" onClick={() => setConfirmCancel(true)}>
                Cancelar pedido
              </button>
            ))}
        </div>
      )}
      <RowError message={error} />
    </li>
  );
}

function OrdersPanel() {
  const [status, setStatus] = useState('confirmado');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useApi(() => api.adminOrders({ status, q }), [status, q]);

  return (
    <div className="space-y-5">
      <Pills tabs={ORDER_TABS} value={status} counts={data?.counts} onChange={setStatus} label="Estado de los pedidos" />
      <SearchBox id="admin-order-search" value={search} onChange={setSearch} placeholder="Número de pedido o correo del cliente" />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <div className="card h-40 animate-pulse" />
      ) : data.items.length === 0 ? (
        <EmptyState title={q ? 'Ningún pedido coincide' : 'No hay pedidos en este estado'} />
      ) : (
        <ul className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {data.items.map((o) => (
            <OrderRow key={`${o.id}:${o.status}`} order={o} allowed={data.transitions[o.status] ?? []} onChanged={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Página ----------

const SECTIONS = [
  { id: 'productos', label: 'Productos' },
  { id: 'pedidos', label: 'Pedidos' },
];

export default function Admin() {
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const section = SECTIONS.some((s) => s.id === params.get('seccion')) ? params.get('seccion') : SECTIONS[0].id;

  if (!session.loaded) return <div className="mx-auto mt-16 h-96 max-w-5xl animate-pulse rounded-2xl bg-tone-900" />;
  if (!session.signedIn || session.user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Solo para administradores"
          action={
            !session.signedIn && session.provider ? (
              <button type="button" className="btn btn-primary" onClick={session.signIn}>
                Iniciar sesión
              </button>
            ) : (
              <Link to="/" className="btn btn-secondary">
                Volver a la tienda
              </Link>
            )
          }
        >
          {session.signedIn ? 'Tu cuenta no tiene permisos de administración.' : 'Inicia sesión con una cuenta de administrador.'}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Administración</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Panel de KeyLab</h1>
      <nav className="mt-8 flex gap-2 border-b border-tone-800" aria-label="Secciones del panel">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setParams({ seccion: s.id }, { replace: true })}
            aria-current={section === s.id ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              section === s.id ? 'border-brand-500 text-tone-50' : 'border-transparent text-tone-400 hover:text-tone-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <div className="mt-6">{section === 'productos' ? <ProductsPanel /> : <OrdersPanel />}</div>
    </div>
  );
}
