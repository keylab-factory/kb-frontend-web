import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';

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

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadCart);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin almacenamiento (modo privado): el carrito vive solo en memoria
    }
  }, [items]);

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
