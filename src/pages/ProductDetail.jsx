import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useCart } from '../context/CartContext.jsx';
import ProductVisual, { visualPadding } from '../components/ProductVisual.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { ErrorState, QuantityInput, Stars, StockBadge } from '../components/ui.jsx';
import { ArrowRightIcon, CartIcon, WrenchIcon } from '../components/icons.jsx';
import { categoryLabel } from '../data/categories.js';
import { formatCOP } from '../utils/format.js';

const BUILDABLE = new Set(['cases', 'pcbs', 'plates', 'switches', 'keycaps', 'stabilizers']);

function compatibilityText(product) {
  if (product.category === 'keyboards') return `Teclado completo ${product.layout}: no necesitas nada más.`;
  if (product.layout) return `Para builds ${product.layout}.`;
  if (product.compat) return `Compatible con ${product.compat.join(', ')}.`;
  if (product.category === 'switches') return `Switch MX de ${product.pins} pines: sirve en cualquier PCB MX${product.pins === 5 ? ' que acepte 5 pines' : ''}.`;
  return null;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, loading, error, reload } = useApi(() => api.product(id), [id]);
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Al navegar a otro producto (p. ej. desde "relacionados") la cantidad vuelve a 1
  useEffect(() => {
    setQuantity(1);
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} title={error.status === 404 ? 'Producto no encontrado' : undefined} />
        <div className="mt-6 text-center">
          <Link to="/tienda" className="btn btn-secondary">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !product) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <div className="card aspect-[4/3] animate-pulse self-start" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-tone-800" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-tone-800" />
          <div className="h-24 animate-pulse rounded bg-tone-800" />
        </div>
      </div>
    );
  }

  const soldOut = product.stock <= 0;
  const compat = compatibilityText(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-tone-500" aria-label="Ruta">
        <Link to="/tienda" className="hover:text-tone-300">
          Tienda
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/tienda?categoria=${product.category}`} className="hover:text-tone-300">
          {categoryLabel(product.category)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-tone-300">{product.name}</span>
      </nav>

      {/* items-start: con aspect-ratio y stretch, el ancho del visual se calcularía desde el alto de la fila */}
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className={`card flex aspect-[4/3] items-center justify-center bg-linear-to-b from-tone-800/40 to-tone-900/30 ${visualPadding(product.category)}`}>
          <ProductVisual product={product} legends />
        </div>

        <div>
          <p className="text-sm text-tone-400">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          <Stars rating={product.rating} reviews={product.reviews} className="mt-3" />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-3xl font-bold tabular-nums">{formatCOP(product.price)}</p>
            <StockBadge stock={product.stock} />
          </div>
          {product.packSize && <p className="mt-1 text-sm text-tone-500">Precio por paquete de {product.packSize} switches · IVA incluido</p>}

          <p className="mt-6 leading-relaxed text-tone-300">{product.description}</p>
          {compat && <p className="mt-4 rounded-xl border border-tone-800 bg-tone-900 px-4 py-3 text-sm text-tone-300">{compat}</p>}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityInput value={quantity} onChange={(q) => setQuantity(Math.max(1, Math.min(q, product.stock)))} max={Math.max(1, product.stock)} />
            <button type="button" className="btn btn-primary flex-1 py-3 sm:flex-none sm:px-8" disabled={soldOut} onClick={() => add(product, quantity)}>
              <CartIcon className="h-5 w-5" />
              {soldOut ? 'Agotado' : 'Agregar al carrito'}
            </button>
          </div>

          {BUILDABLE.has(product.category) && (
            <Link to="/armar" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-400 hover:text-brand-300">
              <WrenchIcon className="h-4 w-4" /> Úsalo en el armador de teclados <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}

          <div className="mt-8">
            <h2 className="font-semibold">Especificaciones</h2>
            <dl className="mt-3 divide-y divide-tone-800 rounded-xl border border-tone-800">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-tone-500">{key}</dt>
                  <dd className="text-tone-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {product.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link key={tag} to={`/tienda?q=${encodeURIComponent(tag)}`} className="chip hover:border-tone-500">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {product.related?.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold tracking-tight">También te puede gustar</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
