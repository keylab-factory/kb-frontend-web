import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import ProductCard from '../components/ProductCard.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui.jsx';
import { SearchIcon, SlidersIcon } from '../components/icons.jsx';
import { SORT_OPTIONS } from '../data/categories.js';
import { formatCOP, plural } from '../utils/format.js';

const PRICE_CAPS = [100000, 250000, 500000, 1000000];

function FilterGroup({ title, children }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-semibold tracking-wider text-tone-500 uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

const optionClass = (active) =>
  `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
    active ? 'bg-tone-800 font-medium text-tone-50' : 'text-tone-400 hover:bg-tone-900 hover:text-tone-200'
  }`;

const pillClass = (active) =>
  `rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
    active ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-tone-800 text-tone-400 hover:border-tone-600 hover:text-tone-200'
  }`;

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') ?? '';
  const layout = params.get('layout') ?? '';
  const q = params.get('q') ?? '';
  const sort = params.get('orden') ?? 'featured';
  const inStock = params.get('stock') === '1';
  const maxPrice = params.get('max') ?? '';

  const [search, setSearch] = useState(q);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useApi(() => api.categories(), []);
  const layouts = useApi(() => api.layouts(), []);
  const products = useApi(
    () => api.products({ category, layout, q, sort, inStock: inStock ? 'true' : '', maxPrice }),
    [category, layout, q, sort, inStock, maxPrice],
  );

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  // La búsqueda se aplica 300 ms después de dejar de escribir
  useEffect(() => {
    if (search === q) return undefined;
    const timer = setTimeout(() => update({ q: search.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const current = categories.data?.find((c) => c.id === category);
  const hasFilters = Boolean(category || layout || q || inStock || maxPrice);
  const items = products.data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header>
        <p className="eyebrow">Tienda</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{current?.name ?? 'Todos los productos'}</h1>
        <p className="mt-2 max-w-2xl text-tone-400">{current?.description ?? 'Teclados listos para usar y cada componente para armar el tuyo.'}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} space-y-7 lg:block`}>
          <FilterGroup title="Categoría">
            <div className="space-y-0.5">
              <button type="button" className={optionClass(!category)} onClick={() => update({ categoria: '' })}>
                Todas
              </button>
              {categories.data?.map((c) => (
                <button key={c.id} type="button" className={optionClass(category === c.id)} onClick={() => update({ categoria: c.id })}>
                  {c.name}
                  <span className="text-xs text-tone-500 tabular-nums">{c.count}</span>
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Layout">
            <div className="flex flex-wrap gap-2">
              <button type="button" className={pillClass(!layout)} onClick={() => update({ layout: '' })}>
                Todos
              </button>
              {layouts.data?.map((l) => (
                <button key={l.id} type="button" className={pillClass(layout === l.id)} onClick={() => update({ layout: l.id })} title={l.description}>
                  {l.name}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Precio máximo">
            <select className="input" value={maxPrice} onChange={(e) => update({ max: e.target.value })}>
              <option value="">Cualquier precio</option>
              {PRICE_CAPS.map((cap) => (
                <option key={cap} value={cap}>
                  Hasta {formatCOP(cap)}
                </option>
              ))}
            </select>
          </FilterGroup>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-tone-300">
            <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={inStock} onChange={(e) => update({ stock: e.target.checked ? '1' : '' })} />
            Solo productos en stock
          </label>

          {hasFilters && (
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => {
                setSearch('');
                setParams({}, { replace: true });
              }}
            >
              Limpiar filtros
            </button>
          )}
        </aside>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-tone-500" />
              <input
                type="search"
                className="input pl-10"
                placeholder="Buscar por nombre, marca o característica..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar productos"
              />
            </div>
            <div className="flex gap-3">
              <select className="input sm:w-56" value={sort} onChange={(e) => update({ orden: e.target.value === 'featured' ? '' : e.target.value })} aria-label="Ordenar">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-secondary lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
                <SlidersIcon className="h-4 w-4" /> Filtros
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm text-tone-500" aria-live="polite">
            {products.data ? plural(products.data.total, 'producto', 'productos') : 'Cargando...'}
          </p>

          <div className="mt-4">
            {products.error ? (
              <ErrorState error={products.error} onRetry={products.reload} />
            ) : products.loading && !products.data ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState title="No encontramos productos" action={<button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Ver todo el catálogo</button>}>
                Prueba con otra búsqueda o quita algunos filtros.
              </EmptyState>
            ) : (
              <div className={`grid gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${products.loading ? 'opacity-60' : ''}`}>
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
