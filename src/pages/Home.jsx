import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import KeyboardPreview from '../components/KeyboardPreview.jsx';
import { BoardVisual, StabVisual, SwitchVisual } from '../components/PartVisuals.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { CardSkeleton, ErrorState, SectionHeading } from '../components/ui.jsx';
import { ArrowRightIcon, ChartIcon, CheckIcon, ShieldIcon, TruckIcon, WrenchIcon } from '../components/icons.jsx';
import { formatCOP } from '../utils/format.js';

// Colorway de respaldo mientras carga el catálogo
const FALLBACK = {
  id: 'fallback',
  name: 'KeyLab65 Midnight',
  layout: '65%',
  price: 890000,
  visual: { case: '#1e2a4a', alpha: '#efe6d2', mod: '#2f3e66', accent: '#e8b04b', legend: '#1e2a4a', modLegend: '#efe6d2' },
};

const CATEGORY_TILES = [
  { id: 'keyboards', title: 'Teclados armados', text: 'Listos para usar', visual: <KeyboardPreview layout="65%" caseColor="#1e2a4a" colors={{ alpha: '#efe6d2', mod: '#2f3e66', accent: '#e8b04b' }} className="w-full" /> },
  { id: 'switches', title: 'Switches', text: 'Lineales, táctiles y clicky', visual: <SwitchVisual stem="#f472b6" top="#18181b" bottom="#f4f4f5" className="h-24" /> },
  { id: 'keycaps', title: 'Keycaps', text: 'PBT y ABS doubleshot', visual: <KeyboardPreview layout="60%" caseColor="#3f3f46" colors={{ alpha: '#fff5f7', mod: '#f29bb2', accent: '#d94f7a' }} className="w-full" /> },
  { id: 'cases', title: 'Cases', text: 'Aluminio, madera, policarbonato', visual: <KeyboardPreview layout="65%" caseColor="#b9a7e0" blank className="w-full" /> },
  { id: 'plates', title: 'Plates', text: 'Latón, FR4, POM y más', visual: <BoardVisual layout="65%" color="#c9a23f" className="w-full" /> },
  { id: 'pcbs', title: 'PCBs', text: 'Hot-swap con QMK y VIA', visual: <BoardVisual layout="60%" color="#14532d" type="pcb" className="w-full" /> },
  { id: 'stabilizers', title: 'Estabilizadores', text: 'Adiós al traqueteo', visual: <StabVisual housing="#c4b5fd" className="h-20" /> },
];

// 1 mosaico grande (2×2) + 4 pequeños + 2 anchos = 3 filas completas de 4 columnas
const tileSpan = (i) => (i === 0 ? 'col-span-2 md:row-span-2' : i >= 5 ? 'md:col-span-2' : '');

const PERKS = [
  { icon: TruckIcon, title: 'Envío gratis', text: 'En compras desde $500.000 a toda Colombia.' },
  { icon: CheckIcon, title: 'Compatibilidad verificada', text: 'El armador valida layout, pines y estabilizadores.' },
  { icon: WrenchIcon, title: 'Lubricado a mano', text: 'Los teclados armados salen afinados de fábrica.' },
  { icon: ShieldIcon, title: 'Garantía de 1 año', text: 'Cambiamos cualquier pieza defectuosa.' },
];

const BUILD_STEPS = ['Elige el layout', 'Escoge un case', 'Suma PCB y plate', 'Decide los switches', 'Viste con keycaps', 'Ajusta los estabilizadores'];

function Hero({ keyboards }) {
  const showcase = keyboards.length ? keyboards : [FALLBACK];
  const [index, setIndex] = useState(0);
  const current = showcase[index % showcase.length];

  useEffect(() => {
    if (showcase.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % showcase.length), 4000);
    return () => clearInterval(timer);
  }, [showcase.length]);

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-[background] duration-700"
        style={{ background: `radial-gradient(60% 60% at 75% 40%, ${current.visual.accent}33, transparent 70%)` }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:pt-20">
        <div className="animate-fade-up">
          <p className="eyebrow">Teclados mecánicos custom · Colombia</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Arma el teclado que suena como tú quieres.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-tone-400">
            Cases, switches, keycaps y todo lo necesario para tu build, con un armador que verifica la compatibilidad de cada pieza.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/armar" className="btn btn-primary px-6 py-3 text-base">
              Arma tu teclado <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link to="/tienda" className="btn btn-secondary px-6 py-3 text-base">
              Ver la tienda
            </Link>
          </div>
        </div>

        <div>
          <Link to={current.id === 'fallback' ? '/tienda' : `/producto/${current.id}`} className="block" aria-label={`Ver ${current.name}`}>
            <KeyboardPreview
              key={current.id}
              layout={current.layout}
              caseColor={current.visual.case}
              colors={current.visual}
              legends
              className="w-full animate-fade-up drop-shadow-[0_30px_40px_var(--hero-shadow)]"
              title={current.name}
            />
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{current.name}</p>
              <p className="text-sm text-tone-400">
                {current.layout} · {formatCOP(current.price)}
              </p>
            </div>
            {showcase.length > 1 && (
              <div className="flex gap-2">
                {showcase.map((kb, i) => (
                  <button
                    key={kb.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-7 w-7 rounded-full border-2 transition ${i === index % showcase.length ? 'scale-110 border-tone-50' : 'border-tone-700 hover:border-tone-500'}`}
                    style={{ background: `linear-gradient(135deg, ${kb.visual.case} 50%, ${kb.visual.accent} 50%)` }}
                    aria-label={`Ver ${kb.name}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const featured = useApi(() => api.products({ featured: true }), []);
  const items = featured.data?.items ?? [];
  const keyboards = items.filter((p) => p.category === 'keyboards');

  return (
    <>
      <Hero keyboards={keyboards} />

      <section className="border-y border-tone-800/80 bg-tone-900/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                <Icon />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-tone-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHeading eyebrow="Categorías" title="Todo para tu próximo build" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORY_TILES.map((tile, i) => (
            <Link
              key={tile.id}
              to={`/tienda?categoria=${tile.id}`}
              className={`group card flex flex-col justify-between gap-6 p-5 transition-colors hover:border-tone-600 ${tileSpan(i)}`}
            >
              <div className={`flex items-center justify-center ${i === 0 ? 'flex-1 py-6' : 'h-24'}`}>
                <div className="w-full max-w-[90%] transition-transform duration-300 group-hover:scale-105 [&>svg]:mx-auto">{tile.visual}</div>
              </div>
              <div>
                <p className="font-semibold">{tile.title}</p>
                <p className="text-sm text-tone-400">{tile.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHeading
          eyebrow="Destacados"
          title="Los favoritos de la comunidad"
          action={
            <Link to="/tienda" className="btn btn-ghost">
              Ver todo <ArrowRightIcon className="h-4 w-4" />
            </Link>
          }
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.error ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <ErrorState error={featured.error} onRetry={featured.reload} />
            </div>
          ) : featured.loading && !items.length ? (
            Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)
          ) : (
            items.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="card grid items-center gap-10 overflow-hidden p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Armador paso a paso</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">¿Tu primer build? Te guiamos pieza por pieza.</h2>
            <p className="mt-3 text-tone-400">
              Solo te mostramos piezas compatibles con tu layout y te avisamos si algo no encaja: switches de 5 pines en una PCB de 3, estabilizadores sin cortes en la plate...
            </p>
            <ol className="mt-6 grid gap-2 sm:grid-cols-2">
              {BUILD_STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-sm text-tone-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tone-800 text-xs font-bold text-brand-400">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <Link to="/armar" className="btn btn-primary mt-8">
              Empezar a armar <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <KeyboardPreview layout="75%" caseColor="#5b5f66" blank switchColor="#f472b6" className="w-full" title="Build en progreso" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Link to="/comparador" className="group card flex flex-col gap-4 p-6 transition-colors hover:border-tone-600 sm:flex-row sm:items-center sm:p-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
            <ChartIcon className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">Comparador de mercado</h2>
            <p className="mt-1 text-sm text-tone-400">
              Nuestro scraper en Python revisa tiendas internacionales y te muestra dónde está la mejor relación precio de cada componente.
            </p>
          </div>
          <span className="btn btn-secondary group-hover:border-tone-500">
            Ver comparador <ArrowRightIcon className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </>
  );
}
