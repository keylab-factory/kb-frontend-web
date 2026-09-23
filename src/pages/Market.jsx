import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { ErrorState } from '../components/ui.jsx';
import { ExternalIcon, SearchIcon } from '../components/icons.jsx';
import { categoryLabel } from '../data/categories.js';
import { useFx } from '../hooks/useFx.js';
import { formatCOP, formatShortDate, formatUSD, plural, timeAgo } from '../utils/format.js';

const CATEGORY_ORDER = ['keycaps', 'switches', 'cases', 'plates', 'pcbs', 'stabilizers', 'keyboards', 'accessories'];
const LAYOUTS = ['60%', '65%', '75%', 'TKL', '40%', '96%', '100%', 'Alice'];
const SORTS = [
  { id: 'price_asc', label: 'Más baratos' },
  { id: 'score', label: 'Mejor puntaje' },
  { id: 'discount', label: 'Mayor descuento' },
  { id: 'price_desc', label: 'Más caros' },
];
const PAGE_SIZE = 25;
const MAX_ROWS = 200; // límite de la API por petición
// Serie única del gráfico: el color cambia con el tema (validado para cada superficie en index.css)
const BAR_COLOR = 'var(--chart-1)';
const BAR_HOVER = 'var(--chart-1-hover)';

const money = (value, unit) => (unit === 'switch' ? formatUSD(value, 3) : formatUSD(value));

function StatTile({ label, value, hint }) {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-xs text-tone-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-tone-500">{hint}</p>}
    </div>
  );
}

function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="h-full w-full rounded-lg bg-tone-800" aria-hidden="true" />;
  return (
    <img
      src={`${src}${src.includes('?') ? '&' : '?'}width=240`}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full rounded-lg bg-white object-contain"
    />
  );
}

function BestCard({ item, unit, copRate, rank }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group card flex gap-4 p-3.5 transition-colors hover:border-tone-600">
      <div className="relative h-20 w-20 shrink-0">
        <Thumb src={item.image} alt="" />
        <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-tone-950 text-xs font-bold ring-1 ring-tone-700">{rank}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand-300">{item.title}</p>
        <p className="mt-0.5 text-xs text-tone-500">
          {item.store_name}
          {item.layout && ` · ${item.layout}`}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">{formatUSD(item.price_usd)}</span>
          {unit === 'switch' && (
            <span className="text-xs text-tone-400">
              {money(item.unit_price_usd, unit)}/switch · {item.quantity}
              {item.quantity_assumed ? '?' : ''} u.
            </span>
          )}
          <span className="text-xs text-tone-500">≈ {formatCOP(item.price_usd * copRate)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="chip">Puntaje {item.score}</span>
          {item.vs_median_pct < 0 && <span className="chip border-emerald-500/30 text-emerald-300">{Math.round(item.vs_median_pct)}% vs mediana</span>}
          {item.discount_pct > 0 && <span className="chip border-brand-500/30 text-brand-300">−{Math.round(item.discount_pct)}% dto.</span>}
        </div>
      </div>
    </a>
  );
}

/** Barras horizontales: precio mediano por tienda (menor es mejor). */
function StoreBars({ rows, unit, copRate }) {
  const [active, setActive] = useState(null);
  const [asTable, setAsTable] = useState(false);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.median));

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Precio mediano por tienda</h3>
          <p className="text-xs text-tone-500">{unit === 'switch' ? 'USD por switch' : 'USD'} · solo productos en stock · menor es mejor</p>
        </div>
        <button type="button" className="text-xs font-medium text-tone-400 hover:text-tone-50" onClick={() => setAsTable((t) => !t)}>
          {asTable ? 'Ver gráfico' : 'Ver tabla'}
        </button>
      </div>

      {asTable ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-tone-500">
              <th className="py-1.5 font-medium">Tienda</th>
              <th className="py-1.5 text-right font-medium">Mediana</th>
              <th className="py-1.5 text-right font-medium">Productos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tone-800 tabular-nums">
            {rows.map((r) => (
              <tr key={r.store}>
                <td className="py-1.5">{r.store_name}</td>
                <td className="py-1.5 text-right">{money(r.median, unit)}</td>
                <td className="py-1.5 text-right text-tone-400">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="mt-4 space-y-1">
          {rows.map((r, i) => {
            const isActive = active === r.store;
            return (
              <li
                key={r.store}
                tabIndex={0}
                onMouseEnter={() => setActive(r.store)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(r.store)}
                onBlur={() => setActive(null)}
                className="relative grid grid-cols-[96px_1fr] items-center gap-3 rounded-md py-1 outline-none focus-visible:ring-1 focus-visible:ring-tone-600"
                aria-label={`${r.store_name}: ${money(r.median, unit)}, ${r.count} productos`}
              >
                <span className={`truncate text-sm ${isActive ? 'text-tone-50' : 'text-tone-300'}`}>{r.store_name}</span>
                <div className="flex items-center gap-2 border-l border-tone-700">
                  <div
                    className="h-3.5 rounded-r-[4px] transition-colors"
                    style={{ width: `calc((100% - 76px) * ${r.median / max})`, background: isActive ? BAR_HOVER : BAR_COLOR }}
                  />
                  <span className="text-xs text-tone-400 tabular-nums">{money(r.median, unit)}</span>
                  {i === 0 && <span className="hidden text-[11px] font-medium text-emerald-300 sm:inline">más económica</span>}
                </div>
                {isActive && (
                  <div role="tooltip" className="pointer-events-none absolute -top-11 left-28 z-10 rounded-lg border border-tone-700 bg-tone-950 px-3 py-1.5 text-xs shadow-xl">
                    <p className="font-semibold text-tone-50">
                      {money(r.median, unit)} <span className="font-normal text-tone-500">≈ {formatCOP(r.median * copRate)}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-tone-400">
                      <span className="inline-block h-0.5 w-3 rounded" style={{ background: BAR_COLOR }} />
                      {r.store_name} · {plural(r.count, 'producto', 'productos')}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ProductTable({ category, unit, copRate }) {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState('');
  const [inStock, setInStock] = useState(true);
  const [withAddons, setWithAddons] = useState(false);
  const [sort, setSort] = useState('price_asc');
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);
  useEffect(() => {
    setPages(1);
  }, [category, search, layout, inStock, withAddons, sort]);

  const { data, loading, error, reload } = useApi(
    () =>
      api.marketProducts({
        category,
        q: search,
        layout,
        inStock: inStock ? 'true' : '',
        hideAddons: withAddons ? '' : 'true',
        sort,
        limit: Math.min(PAGE_SIZE * pages, MAX_ROWS),
      }),
    [category, search, layout, inStock, withAddons, sort, pages],
  );

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold">Todos los productos de {categoryLabel(category).toLowerCase()}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-tone-500" />
          <input type="search" className="input pl-10" placeholder="Buscar por nombre, marca o tienda..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el mercado" />
        </div>
        <select className="input w-auto" value={layout} onChange={(e) => setLayout(e.target.value)} aria-label="Layout">
          <option value="">Todos los layouts</option>
          {LAYOUTS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-tone-300">
          <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
          Solo en stock
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-tone-300" title="Novelties, spacebars, teclas sueltas, kits parciales...">
          <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={withAddons} onChange={(e) => setWithAddons(e.target.checked)} />
          Incluir repuestos y extras
        </label>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : (
        <div className={`card mt-4 overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-tone-800 text-left text-xs text-tone-500">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Tienda</th>
                <th className="px-4 py-3 font-medium">Layout</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                {unit === 'switch' && <th className="px-4 py-3 text-right font-medium">Por switch</th>}
                <th className="px-4 py-3 text-right font-medium">≈ COP</th>
                <th className="px-4 py-3 text-right font-medium">Puntaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tone-800/70 tabular-nums">
              {data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-tone-800/30">
                  <td className="max-w-80 px-4 py-2.5">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand-300">
                      <span className="line-clamp-1">{p.title}</span>
                      <ExternalIcon className="h-3.5 w-3.5 shrink-0 text-tone-500" />
                    </a>
                    <p className="text-xs text-tone-500">
                      {p.vendor}
                      {!p.available && ' · agotado'}
                      {p.is_addon && ' · repuesto/extra'}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-tone-300">{p.store_name}</td>
                  <td className="px-4 py-2.5 text-tone-400">{p.layout ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {formatUSD(p.price_usd)}
                    {p.discount_pct > 0 && <span className="ml-1.5 text-xs text-brand-300">−{Math.round(p.discount_pct)}%</span>}
                  </td>
                  {unit === 'switch' && (
                    <td className="px-4 py-2.5 text-right text-tone-300">
                      {money(p.unit_price_usd, unit)}
                      {p.quantity_assumed && <span className="text-tone-500" title="La tienda no indica cuántos trae; se asumió un paquete de 10"> *</span>}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right text-tone-400">{formatCOP(p.price_usd * copRate)}</td>
                  <td className="px-4 py-2.5 text-right text-tone-300">{p.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.items.length === 0 && <p className="px-4 py-10 text-center text-sm text-tone-400">Sin resultados con esos filtros.</p>}
        </div>
      )}

      {data && (
        <div className="mt-4 flex items-center justify-between text-sm text-tone-500">
          <span>
            Mostrando {data.items.length} de {data.total}
            {unit === 'switch' && ' · * paquete asumido de 10'}
          </span>
          {data.items.length < data.total &&
            (data.items.length < MAX_ROWS ? (
              <button type="button" className="btn btn-secondary" onClick={() => setPages((p) => p + 1)} disabled={loading}>
                Cargar más
              </button>
            ) : (
              <span>Usa la búsqueda o los filtros para ver el resto.</span>
            ))}
        </div>
      )}
    </section>
  );
}

export default function Market() {
  const { data: market, loading, error, reload } = useApi(() => api.market(), []);
  const { data: fx } = useFx();
  const [params, setParams] = useSearchParams();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={error} onRetry={reload} title={error.status === 404 ? 'El comparador aún no tiene datos' : undefined} />
      </div>
    );
  }
  if (loading || !market) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:px-6">
        <div className="h-10 w-1/3 animate-pulse rounded bg-tone-900" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const categories = CATEGORY_ORDER.filter((c) => market.categories[c]);
  const category = categories.includes(params.get('cat')) ? params.get('cat') : categories[0];
  const data = market.categories[category];
  const { stats, unit } = data;
  // Dólar en vivo (TRM que refresca el servidor); si no está, la tasa usada al hacer el scraping
  const copRate = fx?.rate ?? market.cop_rate;
  const okStores = market.stores.filter((s) => s.status === 'ok');
  const layoutPicks = Object.entries(data.best_by_layout ?? {});
  const perUnit = unit === 'switch' ? ' por switch' : '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header>
        <p className="eyebrow">Comparador de mercado</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">¿Dónde conviene comprar cada pieza?</h1>
        <p className="mt-2 max-w-3xl text-tone-400">
          Nuestro scraper en Python recorrió {okStores.length} tiendas internacionales y analizó {market.productCount.toLocaleString('es-CO')} productos. Precios en dólares; el valor en pesos no incluye envío ni impuestos de importación.
        </p>
        <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-tone-800 bg-tone-900/60 px-3.5 py-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span>
            1 USD = <strong className="font-semibold">{formatCOP(copRate)}</strong>
          </span>
          <span className="text-tone-500">
            {fx
              ? `${fx.kind === 'TRM' ? 'TRM' : 'Tasa de mercado'}${fx.date ? ` del ${formatShortDate(fx.date)}` : ''} · ${fx.source} · consultada ${timeAgo(fx.fetched_at)}`
              : 'tasa usada al hacer el scraping'}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-tone-500">Actualizado {timeAgo(market.generated_at)}:</span>
          {market.stores.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`chip hover:border-tone-500 ${s.status === 'ok' ? '' : 'border-red-500/30 text-red-300'}`}
              title={s.error ?? `${s.count} productos (${s.platform})`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.status === 'ok' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {s.name} · {s.count}
            </a>
          ))}
        </div>
      </header>

      <nav className="mt-8 flex gap-2 overflow-x-auto border-b border-tone-800 pb-px" aria-label="Categorías">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setParams({ cat: c }, { replace: true })}
            aria-current={c === category ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              c === category ? 'border-brand-500 text-tone-50' : 'border-transparent text-tone-400 hover:text-tone-200'
            }`}
          >
            {categoryLabel(c)} <span className="text-tone-500">{market.categories[c].count}</span>
          </button>
        ))}
      </nav>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Productos" value={data.count.toLocaleString('es-CO')} hint={`${data.in_stock} en stock`} />
        <StatTile label="Comparables" value={data.candidates.toLocaleString('es-CO')} hint="En stock, sin repuestos" />
        <StatTile label={`Mínimo${perUnit}`} value={money(stats.min, unit)} hint={stats.min !== null ? `≈ ${formatCOP(stats.min * copRate)}` : undefined} />
        <StatTile label={`Mediana${perUnit}`} value={money(stats.median, unit)} hint={stats.p25 !== null ? `50 % entre ${money(stats.p25, unit)} y ${money(stats.p75, unit)}` : undefined} />
        <StatTile label={`Máximo${perUnit}`} value={money(stats.max, unit)} />
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section>
          <h2 className="font-display text-xl font-bold">Mejor relación precio</h2>
          <p className="text-sm text-tone-400">Puntaje = 80 % qué tan barato es frente al resto + 20 % descuento vigente.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.best.map((item, i) => (
              <BestCard key={item.id} item={item} unit={unit} copRate={copRate} rank={i + 1} />
            ))}
          </div>
          {data.best.length === 0 && <p className="mt-4 text-sm text-tone-500">No hay productos comparables en stock en esta categoría.</p>}
        </section>

        <div className="space-y-6">
          <StoreBars rows={data.store_medians} unit={unit} copRate={copRate} />

          {layoutPicks.length > 0 && (
            <section className="card p-5">
              <h3 className="font-semibold">Lo más barato por layout</h3>
              <ul className="mt-3 divide-y divide-tone-800 text-sm">
                {layoutPicks.map(([layout, item]) => (
                  <li key={layout} className="flex items-center gap-3 py-2">
                    <span className="w-11 shrink-0 font-semibold text-tone-300">{layout}</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-tone-300 hover:text-brand-300">
                      {item.title}
                    </a>
                    <span className="shrink-0 tabular-nums">{formatUSD(item.price_usd)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.biggest_discounts.length > 0 && (
            <section className="card p-5">
              <h3 className="font-semibold">Mayores descuentos</h3>
              <ul className="mt-3 divide-y divide-tone-800 text-sm">
                {data.biggest_discounts.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2">
                    <span className="w-11 shrink-0 font-semibold text-brand-300">−{Math.round(item.discount_pct)}%</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-tone-300 hover:text-brand-300">
                      {item.title}
                    </a>
                    <span className="shrink-0 text-tone-500">{item.store_name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {Object.keys(market.builds ?? {}).length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Presupuesto mínimo de referencia</h2>
          <p className="text-sm text-tone-400">
            Suma de la opción más barata de cada pieza (case, PCB, plate, switches, keycaps y estabilizadores). Es una cota inferior: muchos kits ya incluyen PCB y plate.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(market.builds).map(([layout, build]) => (
              <details key={layout} className="card group px-4 py-3.5">
                <summary className="cursor-pointer list-none">
                  <p className="text-xs text-tone-400">Build {layout}</p>
                  <p className="mt-1 text-xl font-semibold">{formatUSD(build.total_usd)}</p>
                  <p className="text-xs text-tone-500">
                    ≈ {formatCOP(build.total_usd * copRate)} · <span className="text-tone-400 group-open:hidden">ver piezas</span>
                  </p>
                </summary>
                <ul className="mt-3 space-y-1.5 border-t border-tone-800 pt-3 text-xs">
                  {Object.entries(build.parts).map(([slot, part]) => (
                    <li key={slot}>
                      <a href={part.url} target="_blank" rel="noopener noreferrer" className="text-tone-300 hover:text-brand-300">
                        {part.title}
                      </a>
                      <span className="text-tone-500"> · {part.store_name}</span>
                    </li>
                  ))}
                  <li className="text-tone-500">{build.switches_needed} switches</li>
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}

      <ProductTable key={category} category={category} unit={unit} copRate={copRate} />
    </div>
  );
}
