import { Link } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useCart } from '../context/CartContext.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import { EmptyState, QuantityInput } from '../components/ui.jsx';
import { ArrowRightIcon, TrashIcon, TruckIcon } from '../components/icons.jsx';
import { categoryLabel } from '../data/categories.js';
import { formatCOP } from '../utils/format.js';
import { shippingFor } from '../utils/shipping.js';

export default function Cart() {
  const { items, subtotal, setQuantity, remove, clear } = useCart();
  const { data: config } = useApi(() => api.orderConfig(), []);
  const rules = config?.shipping;
  const shipping = shippingFor(subtotal, rules);
  const missingForFree = rules ? Math.max(0, rules.freeFrom - subtotal) : 0;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Tu carrito está vacío"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/tienda" className="btn btn-primary">
                Ir a la tienda
              </Link>
              <Link to="/armar" className="btn btn-secondary">
                Armar un teclado
              </Link>
            </div>
          }
        >
          Explora el catálogo o usa el armador para elegir cada pieza de tu próximo teclado.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Carrito</h1>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card divide-y divide-tone-800">
          {items.map((item) => (
            <article key={item.id} className="flex gap-4 p-4 sm:p-5">
              <Link to={`/producto/${item.id}`} className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-tone-800/50 p-2 sm:h-24 sm:w-32">
                <ProductVisual product={item} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-tone-500">{categoryLabel(item.category)}</p>
                  <Link to={`/producto/${item.id}`} className="font-semibold hover:text-brand-300">
                    {item.name}
                  </Link>
                  <p className="text-sm text-tone-400 tabular-nums">{formatCOP(item.price)} c/u</p>
                </div>
                <div className="flex items-center gap-4">
                  <QuantityInput size="sm" value={item.quantity} max={item.stock} onChange={(q) => setQuantity(item.id, q)} />
                  <p className="w-28 text-right font-semibold tabular-nums">{formatCOP(item.price * item.quantity)}</p>
                  <button type="button" className="rounded-lg p-2 text-tone-500 hover:bg-tone-800 hover:text-red-400" onClick={() => remove(item.id)} aria-label={`Quitar ${item.name}`}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
          <div className="flex justify-between p-4 sm:px-5">
            <Link to="/tienda" className="text-sm font-medium text-tone-400 hover:text-tone-50">
              ← Seguir comprando
            </Link>
            <button type="button" className="text-sm text-tone-500 hover:text-red-400" onClick={clear}>
              Vaciar carrito
            </button>
          </div>
        </section>

        <aside className="card p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Resumen</h2>
          {rules && (
            <div className="mt-4 rounded-xl bg-tone-800/50 p-3.5 text-sm">
              <p className="flex items-center gap-2 text-tone-300">
                <TruckIcon className="h-4 w-4 text-brand-400" />
                {missingForFree > 0 ? (
                  <span>
                    Te faltan <strong className="text-tone-50">{formatCOP(missingForFree)}</strong> para el envío gratis
                  </span>
                ) : (
                  <span className="text-emerald-300">¡Tienes envío gratis!</span>
                )}
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-tone-700">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, (subtotal / rules.freeFrom) * 100)}%` }} />
              </div>
            </div>
          )}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-tone-400">Subtotal</dt>
              <dd className="tabular-nums">{formatCOP(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-tone-400">Envío</dt>
              <dd className="tabular-nums">{shipping === 0 ? 'Gratis' : formatCOP(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-tone-800 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCOP(subtotal + shipping)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-xs text-tone-500">IVA incluido. El precio final lo confirma el servidor al pagar.</p>
          <Link to="/checkout" className="btn btn-primary mt-5 w-full py-3">
            Continuar al pago <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
