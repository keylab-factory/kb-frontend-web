import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useCart } from '../context/CartContext.jsx';
import { useSession } from '../auth/session.js';
import { AlertIcon, ShieldIcon } from '../components/icons.jsx';
import { formatCOP } from '../utils/format.js';
import { shippingFor } from '../utils/shipping.js';

const FIELDS = [
  { name: 'name', label: 'Nombre completo', autoComplete: 'name', span: 2 },
  { name: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Teléfono / celular', type: 'tel', autoComplete: 'tel' },
  { name: 'address', label: 'Dirección de entrega', autoComplete: 'street-address', span: 2 },
  { name: 'city', label: 'Ciudad', autoComplete: 'address-level2' },
];

const fromAddress = (a) => ({ address: [a.line1, a.line2].filter(Boolean).join(', '), city: `${a.city}, ${a.department}` });

export default function Checkout() {
  const navigate = useNavigate();
  const session = useSession();
  const { items, subtotal, clear } = useCart();
  const { data: config } = useApi(() => api.orderConfig(), []);
  const { data: profile } = useApi(() => (session.signedIn ? api.me() : Promise.resolve(null)), [session.signedIn]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '', city: '' });
  const [addressId, setAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pse');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Con sesión se llenan los datos de la cuenta y la dirección predeterminada,
  // sin pisar lo que el cliente ya haya escrito
  const [prefilledFor, setPrefilledFor] = useState(null);
  if (profile && prefilledFor !== profile.id) {
    setPrefilledFor(profile.id);
    const main = profile.addresses.find((a) => a.isDefault) ?? profile.addresses[0];
    const saved = {
      name: profile.name ?? session.user?.name ?? '',
      email: profile.email ?? session.user?.email ?? '',
      phone: main?.phone ?? profile.phone ?? '',
      ...(main && fromAddress(main)),
    };
    setCustomer((c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v || saved[k] || ''])));
    if (main) setAddressId(main.id);
  }

  if (items.length === 0 && !submitting) return <Navigate to="/carrito" replace />;

  function chooseAddress(a) {
    setAddressId(a.id);
    setCustomer((c) => ({ ...c, name: a.recipient, phone: a.phone, ...fromAddress(a) }));
  }

  const shipping = shippingFor(subtotal, config?.shipping);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      const order = await api.createOrder({
        customer,
        paymentMethod,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      });
      clear();
      // La clave va en el enlace: es lo que permite volver a ver el pedido sin sesión
      navigate(`/pedido/${order.id}?clave=${encodeURIComponent(order.accessKey)}`, { replace: true });
    } catch (err) {
      setErrors(err.data?.details ?? {});
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  const update = (field) => (e) => setCustomer((c) => ({ ...c, [field]: e.target.value }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Finalizar compra</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          {session.provider && session.loaded && !session.signedIn && (
            <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <p className="text-tone-300">¿Tienes cuenta? Usa tus direcciones guardadas y consulta este pedido después.</p>
              <button type="button" className="btn btn-secondary text-sm" onClick={session.signIn}>
                Iniciar sesión
              </button>
            </div>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold">Datos de entrega</h2>
            {profile?.addresses.length > 0 && (
              <fieldset className="mt-4">
                <legend className="label">Tus direcciones</legend>
                <div className="flex flex-wrap gap-2">
                  {profile.addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => chooseAddress(a)}
                      aria-pressed={addressId === a.id}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        addressId === a.id ? 'border-brand-500 bg-brand-500/5' : 'border-tone-800 hover:border-tone-600'
                      }`}
                    >
                      <span className="font-medium">{a.label}</span>
                      <span className="block text-xs text-tone-400">
                        {a.line1}, {a.city}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.name} className={f.span === 2 ? 'sm:col-span-2' : ''}>
                  <label htmlFor={f.name} className="label">
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type ?? 'text'}
                    autoComplete={f.autoComplete}
                    className={`input ${errors[f.name] ? 'border-red-500/70' : ''}`}
                    value={customer[f.name]}
                    onChange={update(f.name)}
                    aria-invalid={Boolean(errors[f.name])}
                    aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
                  />
                  {errors[f.name] && (
                    <p id={`${f.name}-error`} className="mt-1 text-xs text-red-400">
                      {errors[f.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold">Método de pago</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {Object.entries(config?.paymentMethods ?? { pse: 'PSE' }).map(([id, label]) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors ${
                    paymentMethod === id ? 'border-brand-500 bg-brand-500/5' : 'border-tone-800 hover:border-tone-600'
                  }`}
                >
                  <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="accent-brand-500" />
                  {label}
                </label>
              ))}
            </div>
            {errors.paymentMethod && <p className="mt-2 text-xs text-red-400">{errors.paymentMethod}</p>}
            <p className="mt-4 flex items-start gap-2 text-xs text-tone-500">
              <ShieldIcon className="h-4 w-4 shrink-0" />
              Tienda de demostración: no se piden datos de tarjeta ni se realiza ningún cobro.
            </p>
          </section>
        </div>

        <aside className="card p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Tu pedido</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-tone-300">
                  {i.name} <span className="text-tone-500">× {i.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatCOP(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-tone-800 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-tone-400">Subtotal</dt>
              <dd className="tabular-nums">{formatCOP(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-tone-400">Envío</dt>
              <dd className="tabular-nums">{shipping === 0 ? 'Gratis' : formatCOP(shipping)}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCOP(subtotal + shipping)}</dd>
            </div>
          </dl>

          {formError && (
            <p role="alert" className="mt-4 flex gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {formError}
            </p>
          )}

          <button type="submit" className="btn btn-primary mt-5 w-full py-3" disabled={submitting}>
            {submitting ? 'Procesando...' : `Confirmar pedido · ${formatCOP(subtotal + shipping)}`}
          </button>
          <Link to="/carrito" className="mt-3 block text-center text-sm text-tone-400 hover:text-tone-50">
            Volver al carrito
          </Link>
        </aside>
      </form>
    </div>
  );
}
