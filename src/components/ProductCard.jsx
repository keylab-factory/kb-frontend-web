import { Link } from 'react-router';
import { useCart } from '../context/CartContext.jsx';
import { categoryLabel } from '../data/categories.js';
import { formatCOP } from '../utils/format.js';
import ProductVisual, { visualPadding } from './ProductVisual.jsx';
import { Stars } from './ui.jsx';
import { PlusIcon } from './icons.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0;
  const detail = product.layout ?? (product.switchType ? `${product.switchType} · ${product.force} g` : product.profile);

  return (
    <article className="group card flex flex-col overflow-hidden transition-colors hover:border-tone-700">
      <Link to={`/producto/${product.id}`} className="relative block">
        <div className={`flex aspect-[16/11] items-center justify-center bg-linear-to-b from-tone-800/40 to-tone-900/20 ${visualPadding(product.category)}`}>
          <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
            <ProductVisual product={product} />
          </div>
        </div>
        <span className="chip absolute top-3 left-3 bg-tone-900/80 backdrop-blur">{categoryLabel(product.category)}</span>
        {soldOut && <span className="chip absolute top-3 right-3 border-red-500/30 bg-red-500/15 text-red-300">Agotado</span>}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-tone-500">
          {product.brand}
          {detail && <span> · {detail}</span>}
        </p>
        <Link to={`/producto/${product.id}`} className="mt-1 font-semibold leading-snug hover:text-brand-300">
          {product.name}
        </Link>
        <Stars rating={product.rating} reviews={product.reviews} className="mt-1.5" />
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-lg font-bold tabular-nums">{formatCOP(product.price)}</p>
            {product.packSize && <p className="text-xs text-tone-500">Paquete de {product.packSize}</p>}
          </div>
          <button
            type="button"
            className="btn btn-secondary px-3 py-2"
            onClick={() => add(product)}
            disabled={soldOut}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </article>
  );
}
