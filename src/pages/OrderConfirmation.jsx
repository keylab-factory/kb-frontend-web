import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useSession } from '../auth/session.js';
import { ErrorState, OrderStatusBadge } from '../components/ui.jsx';
import { AlertIcon, CheckIcon } from '../components/icons.jsx';
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

// Texto del pago según su estado; nunca afirma un cobro que no ocurrió
function paymentNote(order) {
  switch (order.paymentStatus) {
    case 'aprobado':
      return order.status === 'cancelado' ? 'Pagado después de vencer el plazo: te devolveremos el dinero.' : 'Pagado en línea con Wompi.';
    case 'pendiente':
      return 'Esperando la confirmación de Wompi.';
    case 'rechazado':
      return 'El último intento de pago no fue aprobado.';
    case 'vencido':
      return 'El plazo para pagar venció y el pedido se canceló.';
    default:
      return order.paymentMethod === 'contraentrega' ? 'Pagas al recibir el pedido.' : 'Los pagos en línea no estaban activos: no se realizó ningún cobro.';
  }
}

// Pedido apartado esperando el pago: botón para pagar (o reintentar) en Wompi
function PaymentPanel({ order, accessKey, verifying }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const declined = order.paymentStatus === 'rechazado';

  if (verifying) {
    // Volvió de Wompi y el resultado de ese intento aún no llega: sin botón, para no pagar dos veces
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm" role="status">
        <p className="font-semibold">Verificando tu pago con Wompi…</p>
        <p className="mt-1 text-tone-300">Suele tardar unos segundos. Esta página se actualiza sola.</p>
      </div>
    );
  }

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const { checkoutUrl } = await api.orderPayment(order.id, accessKey);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className={`mx-auto mt-6 max-w-xl rounded-xl border px-5 py-4 text-sm ${declined ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
      <p className="font-semibold">{declined ? 'El pago no fue aprobado' : 'Tus productos están apartados'}</p>
      <p className="mt-1 text-tone-300">
        {declined
          ? 'Puedes intentarlo de nuevo con otro medio de pago.'
          : 'Si ya pagaste, Wompi tarda unos segundos en confirmarlo: esta página se actualiza sola. Si no se paga en una hora, el pedido se cancela.'}
      </p>
      <button type="button" className="btn btn-primary mt-3" onClick={pay} disabled={busy}>
        {busy ? 'Abriendo Wompi...' : declined ? 'Intentar de nuevo' : 'Pagar ahora'}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-red-300">
          {error}
        </p>
      )}
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
  const { data: order, error, reload } = useApi(
    () => (session.loaded ? api.order(id, key) : new Promise(() => {})),
    [id, key, session.loaded, session.signedIn],
  );

  // Mientras el pedido espera el pago, se consulta cada 5 s durante 3 minutos. Wompi
  // devuelve al cliente con ?id=<transacción>: hasta que llegue el resultado de ese
  // intento, se muestra "verificando" (y no el rechazo de un intento anterior).
  const waiting = order?.status === 'pendiente_pago';
  const returnedTx = params.get('id');
  const [polls, setPolls] = useState(0);
  const verifying = Boolean(waiting && returnedTx && order.paymentTransactionId !== returnedTx && polls < 36);
  useEffect(() => {
    if (!waiting || polls >= 36) return undefined;
    const timer = setTimeout(() => {
      setPolls((n) => n + 1);
      reload();
    }, 5000);
    return () => clearTimeout(timer);
  }, [waiting, polls, order, reload]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (!order) {
    return <div className="mx-auto mt-16 h-96 max-w-3xl animate-pulse rounded-2xl bg-tone-900" />;
  }

  const name = order.customer.name.split(' ')[0];
  const pendingPayment = order.status === 'pendiente_pago';
  const cancelled = order.status === 'cancelado';
  const title = pendingPayment ? `Tu pedido está apartado, ${name}` : cancelled ? 'Este pedido fue cancelado' : `¡Gracias por tu compra, ${name}!`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            pendingPayment ? 'bg-amber-500/15 text-amber-400' : cancelled ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
          }`}
        >
          {pendingPayment || cancelled ? <AlertIcon className="h-7 w-7" /> : <CheckIcon className="h-7 w-7" />}
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-tone-400">
          Pedido <span className="font-mono font-semibold text-tone-200">{order.id}</span> · {formatDate(order.createdAt)}
        </p>
        {session.signedIn ? <p className="mt-1 text-sm text-tone-500">Lo encuentras cuando quieras en Mi cuenta.</p> : key && <SaveLink />}
        {pendingPayment && <PaymentPanel order={order} accessKey={key} verifying={verifying} />}
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
          <p className="mt-2 text-xs text-tone-500">{paymentNote(order)}</p>
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
