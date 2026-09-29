const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Lo registra AuthProvider cuando hay sesión; devuelve el JWT vigente del usuario
let tokenGetter = null;
export function setTokenGetter(fn) {
  tokenGetter = fn;
}

async function request(path, { auth = false, ...options } = {}) {
  // Solo las rutas de cuenta y pedidos llevan el token: el catálogo es público
  const token = auth && tokenGetter ? await tokenGetter().catch(() => null) : null;
  let res;
  try {
    res = await fetch(BASE + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...options.headers },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. ¿Está corriendo la API?', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? `Error ${res.status}`, res.status, data);
  return data;
}

// Quita parámetros vacíos para no mandar "?q=&layout="
function query(params = {}) {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false);
  return clean.length ? `?${new URLSearchParams(clean)}` : '';
}

const send = (method, body) => ({ method, body: JSON.stringify(body), auth: true });

export const api = {
  categories: () => request('/categories'),
  layouts: () => request('/layouts'),
  products: (params) => request(`/products${query(params)}`),
  product: (id) => request(`/products/${encodeURIComponent(id)}`),
  validateBuild: (build) => request('/builds/validate', { method: 'POST', body: JSON.stringify(build) }),
  orderConfig: () => request('/orders/config'),
  // Con sesión, el pedido queda asociado a la cuenta
  createOrder: (order) => request('/orders', send('POST', order)),
  // Sin sesión, un pedido solo se abre con la clave que trae el enlace de confirmación
  order: (id, key) => request(`/orders/${encodeURIComponent(id)}${query({ key })}`, { auth: true }),
  // Enlace nuevo al Web Checkout de Wompi para un pedido que sigue esperando el pago
  orderPayment: (id, key) => request(`/orders/${encodeURIComponent(id)}/payment${query({ key })}`, { auth: true }),
  fx: () => request('/fx'),
  market: () => request('/market'),
  marketProducts: (params) => request(`/market/products${query(params)}`),

  departments: () => request('/users/departments'),

  // Cuenta (requieren sesión)
  me: () => request('/users/me', { auth: true }),
  updateMe: (data) => request('/users/me', send('PATCH', data)),
  createAddress: (data) => request('/users/me/addresses', send('POST', data)),
  updateAddress: (id, data) => request(`/users/me/addresses/${encodeURIComponent(id)}`, send('PATCH', data)),
  deleteAddress: (id) => request(`/users/me/addresses/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  myOrders: () => request('/orders', { auth: true }),
  cart: () => request('/cart', { auth: true }),
  saveCart: (items) => request('/cart', send('PUT', { items })),
  builds: () => request('/builds', { auth: true }),
  saveBuild: (build) => request('/builds', send('POST', build)),
  deleteBuild: (id) => request(`/builds/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),

  // Administración (requieren una sesión con rol admin)
  adminProducts: (params) => request(`/admin/products${query(params)}`, { auth: true }),
  adminUpdateProduct: (id, data) => request(`/admin/products/${encodeURIComponent(id)}`, send('PATCH', data)),
  adminOrders: (params) => request(`/admin/orders${query(params)}`, { auth: true }),
  adminUpdateOrder: (id, data) => request(`/admin/orders/${encodeURIComponent(id)}`, send('PATCH', data)),
};
