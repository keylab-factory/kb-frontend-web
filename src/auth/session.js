import { createContext, useContext } from 'react';

/**
 * Sesión del cliente, independiente del proveedor (Clerk o la sesión local de
 * desarrollo). Las páginas solo conocen esta forma:
 *
 *   provider   'clerk' | 'local' | null (sin cuentas configuradas)
 *   loaded     false mientras el proveedor averigua si hay sesión
 *   signedIn   true con una sesión válida
 *   user       { id, name, email, imageUrl, role } o null. role = 'admin' muestra el
 *              panel; es solo para la interfaz: el backend verifica el rol en el token
 *   getToken   () => Promise<string|null>, el JWT que se manda al backend
 *   signIn / signOut / openProfile
 */
export const GUEST = {
  provider: null,
  loaded: true,
  signedIn: false,
  user: null,
  getToken: async () => null,
  signIn: () => {},
  signOut: async () => {},
  openProfile: null,
};

export const SessionContext = createContext(GUEST);

export const useSession = () => useContext(SessionContext);
