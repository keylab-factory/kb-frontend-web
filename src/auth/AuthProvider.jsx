import { Suspense, lazy, useCallback, useState } from 'react';
import { setTokenGetter } from '../api.js';
import { GUEST, SessionContext } from './session.js';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const LOCAL = import.meta.env.VITE_AUTH_MODE === 'local';

// Solo se descarga el código del proveedor configurado. Sin ninguno, la tienda
// funciona igual que siempre: todos compran como invitados.
const Bridge = LOCAL ? lazy(() => import('./LocalSession.jsx')) : CLERK_KEY ? lazy(() => import('./ClerkSession.jsx')) : null;
const INITIAL = Bridge ? { ...GUEST, provider: LOCAL ? 'local' : 'clerk', loaded: false } : GUEST;

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(INITIAL);

  // El token se registra en la API antes de publicar la sesión: los efectos de las
  // páginas corren antes que los de este componente y ya deben poder usarlo.
  const update = useCallback((next) => {
    setTokenGetter(next.signedIn ? next.getToken : null);
    setSession(next);
  }, []);

  return (
    <>
      {Bridge && (
        <Suspense fallback={null}>
          <Bridge onChange={update} />
        </Suspense>
      )}
      <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
    </>
  );
}
