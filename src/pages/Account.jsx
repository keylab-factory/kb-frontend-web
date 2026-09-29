import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { useSession } from '../auth/session.js';
import { useApi } from '../hooks/useApi.js';
import { EmptyState, ErrorState } from '../components/ui.jsx';
import { AlertIcon, TrashIcon, UserIcon } from '../components/icons.jsx';
import { formatCOP, formatDate, plural } from '../utils/format.js';

const TABS = [
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'direcciones', label: 'Direcciones' },
  { id: 'builds', label: 'Builds guardados' },
  { id: 'datos', label: 'Mis datos' },
];

const Skeleton = () => <div className="card h-40 animate-pulse" />;

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-400">
      {message}
    </p>
  );
}

function FormAlert({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

// ---------- Pedidos ----------

function OrdersTab() {
  const { data, loading, error, reload } = useApi(() => api.myOrders(), []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Skeleton />;
  if (!data.items.length) {
    return (
      <EmptyState title="Aún no tienes pedidos" action={<Link to="/tienda" className="btn btn-primary">Ir a la tienda</Link>}>
        Los pedidos que hagas con tu sesión iniciada aparecerán aquí.
      </EmptyState>
    );
  }
  return (
    <ul className="space-y-3">
      {data.items.map((order) => {
        const units = order.items.reduce((sum, i) => sum + i.quantity, 0);
        return (
          <li key={order.id}>
            <Link to={`/pedido/${order.id}`} className="card flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:border-tone-600 sm:p-5">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold">{order.id}</p>
                <p className="mt-0.5 text-sm text-tone-400">
                  {formatDate(order.createdAt)} · {plural(units, 'producto', 'productos')}
                </p>
                <p className="mt-1 truncate text-sm text-tone-300">{order.items.map((i) => i.name).join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums">{formatCOP(order.total)}</p>
                <p className="mt-1 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 capitalize">{order.status}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- Direcciones ----------

const EMPTY_ADDRESS = { label: '', recipient: '', phone: '', line1: '', line2: '', city: '', department: '', notes: '', isDefault: false };
const ADDRESS_FIELDS = [
  { name: 'label', label: 'Nombre (Casa, Oficina...)' },
  { name: 'recipient', label: 'Quién recibe', autoComplete: 'name' },
  { name: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel' },
  { name: 'line1', label: 'Dirección', autoComplete: 'address-line1', span: 2 },
  { name: 'line2', label: 'Apto, torre, barrio (opcional)', autoComplete: 'address-line2', span: 2 },
  { name: 'city', label: 'Ciudad o municipio', autoComplete: 'address-level2' },
];

function AddressForm({ initial, departments, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const prefix = initial?.id ?? 'new';

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      const { id, ...data } = form;
      await onSave(data);
    } catch (err) {
      setErrors(err.data?.details ?? {});
      setFormError(err.message);
      setBusy(false);
    }
  }

  const input = (f) => (
    <div key={f.name} className={f.span === 2 ? 'sm:col-span-2' : ''}>
      <label htmlFor={`${prefix}-${f.name}`} className="label">
        {f.label}
      </label>
      <input
        id={`${prefix}-${f.name}`}
        type={f.type ?? 'text'}
        autoComplete={f.autoComplete}
        className={`input ${errors[f.name] ? 'border-red-500/70' : ''}`}
        value={form[f.name] ?? ''}
        onChange={set(f.name)}
        aria-invalid={Boolean(errors[f.name])}
        aria-describedby={errors[f.name] ? `${prefix}-${f.name}-error` : undefined}
      />
      <FieldError id={`${prefix}-${f.name}-error`} message={errors[f.name]} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {ADDRESS_FIELDS.map(input)}
        <div>
          <label htmlFor={`${prefix}-department`} className="label">
            Departamento
          </label>
          <select
            id={`${prefix}-department`}
            className={`input ${errors.department ? 'border-red-500/70' : ''}`}
            value={form.department ?? ''}
            onChange={set('department')}
            aria-invalid={Boolean(errors.department)}
          >
            <option value="">Elige uno</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <FieldError message={errors.department} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${prefix}-notes`} className="label">
            Indicaciones para el mensajero (opcional)
          </label>
          <input id={`${prefix}-notes`} className="input" value={form.notes ?? ''} onChange={set('notes')} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-tone-300">
        <input type="checkbox" className="accent-brand-500" checked={Boolean(form.isDefault)} onChange={set('isDefault')} />
        Usar como dirección predeterminada
      </label>
      <FormAlert message={formError} />
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Guardando...' : 'Guardar dirección'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function AddressesTab() {
  const profile = useApi(() => api.me(), []);
  const departments = useApi(() => api.departments(), []);
  const [editing, setEditing] = useState(null); // 'new' | id de la dirección
  const [actionError, setActionError] = useState(null);

  const error = profile.error ?? departments.error;
  if (error) return <ErrorState error={error} onRetry={() => { profile.reload(); departments.reload(); }} />;
  if (!profile.data || !departments.data) return <Skeleton />;

  const addresses = profile.data.addresses;
  const deps = departments.data.items;

  async function run(action) {
    setActionError(null);
    try {
      await action();
      setEditing(null);
      profile.reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <FormAlert message={actionError} />
      {addresses.map((a) =>
        editing === a.id ? (
          <AddressForm key={a.id} initial={a} departments={deps} onCancel={() => setEditing(null)} onSave={(data) => api.updateAddress(a.id, data).then(() => { setEditing(null); profile.reload(); })} />
        ) : (
          <article key={a.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
            <div className="min-w-0 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                {a.label}
                {a.isDefault && <span className="chip border-brand-500/30 bg-brand-500/10 text-brand-300">Predeterminada</span>}
              </p>
              <p className="mt-1 text-tone-300">{a.recipient} · {a.phone}</p>
              <p className="text-tone-400">
                {a.line1}
                {a.line2 && `, ${a.line2}`}
              </p>
              <p className="text-tone-400">
                {a.city}, {a.department}
              </p>
              {a.notes && <p className="mt-1 text-xs text-tone-500">{a.notes}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {!a.isDefault && (
                <button type="button" className="btn btn-ghost text-sm" onClick={() => run(() => api.updateAddress(a.id, { isDefault: true }))}>
                  Hacer predeterminada
                </button>
              )}
              <button type="button" className="btn btn-secondary text-sm" onClick={() => setEditing(a.id)}>
                Editar
              </button>
              <button type="button" className="btn btn-ghost text-sm text-red-300" onClick={() => run(() => api.deleteAddress(a.id))} aria-label={`Borrar la dirección ${a.label}`}>
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </article>
        ),
      )}

      {editing === 'new' ? (
        // La primera dirección nace como predeterminada
        <AddressForm initial={{ isDefault: addresses.length === 0 }} departments={deps} onCancel={() => setEditing(null)} onSave={(data) => api.createAddress(data).then(() => { setEditing(null); profile.reload(); })} />
      ) : (
        <>
          {!addresses.length && <p className="text-sm text-tone-400">Guarda una dirección y la llenaremos por ti al finalizar cada compra.</p>}
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            Agregar dirección
          </button>
        </>
      )}
    </div>
  );
}

// ---------- Builds guardados ----------

function BuildsTab() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(() => api.builds(), []);
  const [actionError, setActionError] = useState(null);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Skeleton />;
  if (!data.items.length) {
    return (
      <EmptyState title="No tienes builds guardados" action={<Link to="/armar" className="btn btn-primary">Abrir el armador</Link>}>
        En el armador, usa “Guardar en mi cuenta” para retomar una configuración desde cualquier dispositivo.
      </EmptyState>
    );
  }

  async function remove(id) {
    setActionError(null);
    try {
      await api.deleteBuild(id);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="space-y-3">
      <FormAlert message={actionError} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.items.map((b) => (
          <li key={b.id} className="card flex flex-col p-5">
            <p className="font-semibold">{b.name}</p>
            <p className="mt-1 text-sm text-tone-400">
              Layout {b.layout} · {plural(Object.keys(b.parts).length, 'pieza', 'piezas')} · {formatDate(b.updatedAt)}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-primary text-sm" onClick={() => navigate('/armar', { state: { build: { layout: b.layout, parts: b.parts } } })}>
                Abrir en el armador
              </button>
              <button type="button" className="btn btn-ghost text-sm text-red-300" onClick={() => remove(b.id)} aria-label={`Borrar el build ${b.name}`}>
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Datos personales ----------

function ProfileTab({ session }) {
  const { data, error, reload } = useApi(() => api.me(), []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <Skeleton />;
  return <ProfileForm profile={data} session={session} />;
}

function ProfileForm({ profile, session }) {
  const [form, setForm] = useState({ name: profile.name ?? session.user.name ?? '', phone: profile.phone ?? '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setStatus(null);
    try {
      // El teléfono es opcional: solo se envía si se escribió uno
      await api.updateMe({ name: form.name, ...(form.phone.trim() && { phone: form.phone }) });
      setStatus({ ok: true, message: 'Datos guardados.' });
    } catch (err) {
      setErrors(err.data?.details ?? {});
      setStatus({ ok: false, message: err.message });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} noValidate className="card max-w-xl space-y-4 p-5 sm:p-6">
      <div>
        <label htmlFor="profile-email" className="label">
          Correo electrónico
        </label>
        <input id="profile-email" className="input opacity-70" value={profile.email ?? session.user.email ?? ''} readOnly />
      </div>
      <div>
        <label htmlFor="profile-name" className="label">
          Nombre completo
        </label>
        <input
          id="profile-name"
          className={`input ${errors.name ? 'border-red-500/70' : ''}`}
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          aria-invalid={Boolean(errors.name)}
        />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label htmlFor="profile-phone" className="label">
          Teléfono / celular
        </label>
        <input
          id="profile-phone"
          type="tel"
          className={`input ${errors.phone ? 'border-red-500/70' : ''}`}
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          aria-invalid={Boolean(errors.phone)}
        />
        <FieldError message={errors.phone} />
      </div>
      {status && (
        <p role="status" className={`text-sm ${status.ok ? 'text-emerald-300' : 'text-red-300'}`}>
          {status.message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Guardando...' : 'Guardar'}
        </button>
        {session.openProfile && (
          <button type="button" className="btn btn-secondary" onClick={session.openProfile}>
            Contraseña y seguridad
          </button>
        )}
      </div>
    </form>
  );
}

// ---------- Página ----------

export default function Account() {
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : TABS[0].id;

  if (!session.provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Las cuentas no están disponibles">Por ahora puedes comprar como invitado; con el número de pedido consultas su estado.</EmptyState>
      </div>
    );
  }
  if (!session.loaded) return <div className="mx-auto mt-16 h-96 max-w-5xl animate-pulse rounded-2xl bg-tone-900" />;
  if (!session.signedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Inicia sesión para ver tu cuenta"
          action={
            <button type="button" className="btn btn-primary" onClick={session.signIn}>
              Iniciar sesión
            </button>
          }
        >
          Con tu cuenta guardas direcciones, builds y el historial de tus pedidos, y tu carrito te sigue entre dispositivos.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tone-800 text-tone-300">
            {session.user.imageUrl ? <img src={session.user.imageUrl} alt="" className="h-12 w-12 rounded-full" /> : <UserIcon className="h-6 w-6" />}
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Mi cuenta</h1>
            <p className="text-sm text-tone-400">{session.user.email}</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => session.signOut()}>
          Cerrar sesión
        </button>
      </header>

      <nav className="mt-8 flex gap-2 overflow-x-auto border-b border-tone-800" aria-label="Secciones de la cuenta">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-brand-500 text-tone-50' : 'border-transparent text-tone-400 hover:text-tone-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'pedidos' && <OrdersTab />}
        {tab === 'direcciones' && <AddressesTab />}
        {tab === 'builds' && <BuildsTab />}
        {tab === 'datos' && <ProfileTab session={session} />}
      </div>
    </div>
  );
}
