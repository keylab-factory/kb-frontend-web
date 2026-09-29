import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '../components/icons.jsx';

/**
 * Sesión local SOLO para desarrollo (VITE_AUTH_MODE=local).
 *
 * Reemplaza a Clerk mientras no haya cuenta: el emisor de kb-backend-services/
 * scripts/dev-auth.mjs firma JWT con la misma forma que los de Clerk y los
 * servicios los verifican igual, por firma. No hay contraseñas: cualquiera que
 * llegue a este emisor puede hacerse pasar por cualquier correo, por eso solo
 * escucha en 127.0.0.1 y nunca debe usarse fuera de un computador de desarrollo.
 */
const ISSUER = (import.meta.env.VITE_DEV_AUTH_URL ?? 'http://localhost:4999').replace(/\/$/, '');
const STORAGE_KEY = 'keylab.localSession';

function loadIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.email ? saved : null;
  } catch {
    return null;
  }
}

function SignInDialog({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="local-signin-title">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="local-signin-title" className="font-display text-xl font-bold">
            Iniciar sesión
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-tone-400 hover:text-tone-50" aria-label="Cerrar">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Sesión local de desarrollo: no pide contraseña. En producción este formulario lo reemplaza Clerk.</p>
        <label htmlFor="local-name" className="label mt-4">
          Nombre
        </label>
        <input id="local-name" className="input" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <label htmlFor="local-email" className="label mt-3">
          Correo electrónico
        </label>
        <input id="local-email" type="email" required className="input" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function LocalSession({ onChange }) {
  const [identity, setIdentity] = useState(loadIdentity);
  const [dialog, setDialog] = useState(false);
  const cache = useRef(null);

  const fetchToken = useCallback(async (who) => {
    let res;
    try {
      res = await fetch(`${ISSUER}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(who) });
    } catch {
      throw new Error('El emisor de sesiones local no responde. Arráncalo con: npm run dev:auth (en kb-backend-services).');
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
    cache.current = { ...data, email: who.email };
    return data.token;
  }, []);

  const getToken = useCallback(async () => {
    if (!identity) return null;
    const c = cache.current;
    if (c && c.email === identity.email && c.expiresAt - Date.now() > 30_000) return c.token;
    return fetchToken(identity);
  }, [identity, fetchToken]);

  useEffect(() => {
    onChange({
      provider: 'local',
      loaded: true,
      signedIn: Boolean(identity),
      user: identity ? { id: identity.sub, name: identity.name, email: identity.email, imageUrl: null } : null,
      getToken,
      signIn: () => setDialog(true),
      signOut: async () => {
        cache.current = null;
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // sin almacenamiento
        }
        setIdentity(null);
      },
      openProfile: null,
    });
  }, [identity, getToken, onChange]);

  async function signIn({ name, email }) {
    const who = { name: name.trim(), email: email.trim().toLowerCase() };
    await fetchToken(who);
    const next = { ...who, sub: cache.current.sub };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // la sesión vive solo en memoria
    }
    setIdentity(next);
    setDialog(false);
  }

  return dialog ? <SignInDialog onClose={() => setDialog(false)} onSubmit={signIn} /> : null;
}
