import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { api } from '../api.js';
import { useSession } from '../auth/session.js';

const STORAGE_KEY = 'keylab.cart.v1';
const MAX_QTY = 99;

const CartContext = createContext(null);

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Guardamos una "foto" mínima del producto para pintar el carrito sin pedir la API
const snapshot = (p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  price: p.price,
  category: p.category,
  layout: p.layout,
  compat: p.compat,
  visual: p.visual,
  stock: p.stock,
});

const cap = (qty, stock) => Math.max(1, Math.min(qty, stock ?? MAX_QTY, MAX_QTY));

function addLine(items, product, quantity) {
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    return items.map((i) => (i.id === product.id ? { ...i, quantity: cap(i.quantity + quantity, product.stock) } : i));
  }
  return [...items, { ...snapshot(product), quantity: cap(quantity, product.stock) }];
}

function reducer(items, action) {
  switch (action.type) {
    case 'add':
      return action.lines.reduce((acc, { product, quantity }) => addLine(acc, product, quantity), items);
    case 'setQuantity':
      return items.map((i) => (i.id === action.id ? { ...i, quantity: cap(action.quantity, i.stock) } : i));
    case 'remove':
      return items.filter((i) => i.id !== action.id);
    case 'clear':
      return [];
    default:
      return items;
  }
}

// Trae el carrito guardado en la cuenta y devuelve las líneas que este navegador
// no tiene. Si un producto está en ambos, gana la cantidad de este navegador.
async function remoteOnlyLines(localItems) {
  const remote = await api.cart();
  const missing = remote.items.filter((r) => !localItems.some((i) => i.id === r.productId));
  const products = await Promise.all(missing.map((r) => api.product(r.productId).catch(() => null)));
  return missing.map((r, i) => products[i] && { product: products[i], quantity: r.quantity }).filter(Boolean);
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadCart);
  const [toast, setToast] = useState(null);
  const session = useSession();
  const userId = session.signedIn ? session.user?.id : null;
  // Usuario cuyo carrito ya se fusionó: hasta entonces no se sube nada, para no
  // pisar el carrito de la cuenta con el de este navegador.
  const [syncedUser, setSyncedUser] = useState(null);
  const lastUser = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin almacenamiento (modo privado): el carrito vive solo en memoria
    }
  }, [items]);

  useEffect(() => {
    if (!session.loaded) return undefined;
    if (!userId) {
      // Al cerrar sesión se vacía: el computador puede ser compartido
      if (lastUser.current) dispatch({ type: 'clear' });
      lastUser.current = null;
      setSyncedUser(null);
      return undefined;
    }
    lastUser.current = userId;
    let alive = true;
    remoteOnlyLines(itemsRef.current)
      .then((lines) => {
        if (!alive) return;
        if (lines.length) dispatch({ type: 'add', lines });
        setSyncedUser(userId);
      })
      .catch(() => {
        // Sin conexión con la cuenta el carrito sigue funcionando solo en este navegador
      });
    return () => {
      alive = false;
    };
  }, [session.loaded, userId]);

  useEffect(() => {
    if (!userId || syncedUser !== userId) return undefined;
    const timer = setTimeout(() => {
      api.saveCart(items.map((i) => ({ productId: i.id, quantity: i.quantity }))).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [items, userId, syncedUser]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message) => setToast({ message, id: Date.now() }), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      toast,
      notify,
      add(product, quantity = 1) {
        dispatch({ type: 'add', lines: [{ product, quantity }] });
        notify(`${product.name} se agregó al carrito`);
      },
      addMany(lines, message) {
        dispatch({ type: 'add', lines });
        notify(message);
      },
      setQuantity: (id, quantity) => dispatch({ type: 'setQuantity', id, quantity }),
      remove: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [items, toast, notify],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
