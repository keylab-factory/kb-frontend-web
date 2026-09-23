const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
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

export const api = {
  categories: () => request('/categories'),
  layouts: () => request('/layouts'),
  products: (params) => request(`/products${query(params)}`),
  product: (id) => request(`/products/${encodeURIComponent(id)}`),
  validateBuild: (build) => request('/builds/validate', { method: 'POST', body: JSON.stringify(build) }),
  orderConfig: () => request('/orders/config'),
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  order: (id) => request(`/orders/${encodeURIComponent(id)}`),
  fx: () => request('/fx'),
  market: () => request('/market'),
  marketProducts: (params) => request(`/market/products${query(params)}`),
};
