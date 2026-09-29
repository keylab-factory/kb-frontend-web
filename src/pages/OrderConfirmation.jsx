import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useSession } from '../auth/session.js';
import { ErrorState, OrderStatusBadge } from '../components/ui.jsx';
import { CheckIcon } from '../components/icons.jsx';
import { formatCOP, formatDate } from '../utils/format.js';

// Enlace del pedido para guardar: sin sesión, es la única forma de volver a abrirlo
function SaveLink() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Sin permiso para el portapapeles: el enlace sigue en la barra de direcciones
    }
  }
  return (
    <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
      <p>Guarda el enlace de esta página: con él consultas el estado y la guía de envío.</p>
      <button type="button" className="btn btn-secondary text-sm" onClick={copy}>
        {copied ? 'Enlace copiado' : 'Copiar enlace'}
      </button>
    </div>
  );
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const key = params.get('clave') ?? undefined;
  const session = useSession();
  // Un pedido hecho con sesión se muestra con el token de su dueño: se espera a saber si
  // hay sesión antes de pedirlo, o respondería "no encontrado". Sin sesión, con la clave.
  const { data: order, loading, error, reload } = useApi(
    () => (session.loaded ? api.order(id, key) : new Promise(() => {})),
    [id, key, session.loaded, session.signedIn],
  );

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !order) {
    return <div className="mx-auto mt-16 h-96 max-w-3xl animate-pulse rounded-2xl bg-tone-900" />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">¡Gracias por tu compra, {order.customer.name.split(' ')[0]}!</h1>
        <p className="mt-2 text-tone-400">
          Pedido <span className="font-mono font-semibold text-tone-200">{order.id}</span> · {formatDate(order.createdAt)}
        </p>
        {session.signedIn ? <p className="mt-1 text-sm text-tone-500">Lo encuentras cuando quieras en Mi cuenta.</p> : key && <SaveLink />}
      </div>

      <section className="card mt-10 p-5 sm:p-6">
        <h2 className="font-semibold">Productos</h2>
        <ul className="mt-4 divide-y divide-tone-800 text-sm">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-4 py-2.5">
              <span>
                <Link to={`/producto/${item.productId}`} className="hover:text-brand-300">
                  {item.name}
                </Link>
                <span className="text-tone-500">
                  {' '}
                  × {item.quantity} · {formatCOP(item.unitPrice)} c/u
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{formatCOP(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-tone-800 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-tone-400">Subtotal</dt>
            <dd className="tabular-nums">{formatCOP(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tone-400">Envío</dt>
            <dd className="tabular-nums">{order.shipping === 0 ? 'Gratis' : formatCOP(order.shipping)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCOP(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="card mt-6 grid gap-6 p-5 text-sm sm:grid-cols-2 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            Entrega <OrderStatusBadge status={order.status} />
          </h2>
          <p className="mt-2 text-tone-300">{order.customer.name}</p>
          <p className="text-tone-400">{order.customer.address}</p>
          <p className="text-tone-400">{order.customer.city}</p>
          <p className="text-tone-400">{order.customer.phone}</p>
          {order.trackingCode && (
            <p className="mt-2 text-tone-300">
              Guía de envío: <span className="font-mono font-semibold">{order.trackingCode}</span>
            </p>
          )}
        </div>
        <div>
          <h2 className="font-semibold">Pago</h2>
          <p className="mt-2 text-tone-300">{order.paymentLabel}</p>
          <p className="mt-2 text-xs text-tone-500">Pago simulado: no se realizó ningún cobro.</p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/tienda" className="btn btn-primary">
          Seguir comprando
        </Link>
        {session.signedIn && (
          <Link to="/cuenta" className="btn btn-secondary">
            Ver mis pedidos
          </Link>
        )}
      </div>
    </div>
  );
}
