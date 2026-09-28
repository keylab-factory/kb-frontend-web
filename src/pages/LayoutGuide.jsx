import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import KeyboardPreview from '../components/KeyboardPreview.jsx';
import { ErrorState } from '../components/ui.jsx';
import { ArrowRightIcon } from '../components/icons.jsx';
import { buildLayout, removedKeys } from '../data/layouts.js';

const PREVIEW_COLORS = { alpha: '#d4d4d8', mod: '#8b8b94', accent: '#8b8b94', space: '#d4d4d8', highlight: '#ef4444' };
const CASE = '#3f3f46';

function Removed({ from, to, legends = true }) {
  const highlight = useMemo(() => removedKeys(from, to), [from, to]);
  return <KeyboardPreview layout={from} caseColor={CASE} colors={PREVIEW_COLORS} legends={legends} highlight={highlight} className="w-full" title={`Teclas que tiene el ${from} y no el ${to}`} />;
}

function Legend() {
  return (
    <p className="flex items-center gap-2 text-xs text-tone-400">
      <span className="inline-block h-3 w-3 rounded-sm bg-red-500" aria-hidden="true" />
      En rojo: las teclas que desaparecen
    </p>
  );
}

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-tone-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-tone-200">{children}</dd>
    </div>
  );
}

/** Comparador libre: el usuario elige cualquier par de layouts. */
function Comparator({ layouts }) {
  const [a, setA] = useState('75%');
  const [b, setB] = useState('65%');
  const byId = Object.fromEntries(layouts.map((l) => [l.id, l]));
  const order = layouts.map((l) => l.id);
  // Siempre se muestra lo que pierde el grande frente al pequeño
  const [big, small] = order.indexOf(a) >= order.indexOf(b) ? [a, b] : [b, a];
  const lost = removedKeys(big, small).size;
  const diffKeys = byId[big].keys - byId[small].keys;
  const diffCm = byId[big].widthCm - byId[small].widthCm;

  const select = (value, onChange, label) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-tone-400">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {layouts.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} · {l.keys} teclas
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section className="card p-5 sm:p-8" aria-labelledby="comparador-titulo">
      <h2 id="comparador-titulo" className="font-display text-2xl font-bold">
        Compara dos layouts
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {select(a, setA, 'Primer layout')}
        {select(b, setB, 'Segundo layout')}
      </div>

      {big === small ? (
        <p className="mt-6 text-tone-400">Elige dos layouts distintos para ver en qué cambian.</p>
      ) : (
        <>
          <p className="mt-6 text-lg">
            El <strong>{small}</strong> tiene <strong>{diffKeys} teclas menos</strong> que el {big}
            {diffCm > 0 ? (
              <>
                {' '}
                y mide {diffCm === 1 ? 'cerca de' : 'unos'} <strong>{diffCm} cm menos</strong> de ancho
              </>
            ) : null}
            .
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <figure>
              <Removed from={big} to={small} />
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{big}</span>
                <Legend />
              </figcaption>
            </figure>
            <figure>
              <KeyboardPreview layout={small} caseColor={CASE} colors={PREVIEW_COLORS} legends className="w-full" title={`Teclado ${small}`} />
              <figcaption className="mt-3 font-semibold">{small}</figcaption>
            </figure>
          </div>
          {lost !== diffKeys && (
            <p className="mt-4 text-sm text-tone-400">
              Algunas teclas no desaparecen: cambian de lugar o pasan a una capa con la tecla Fn.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Un escalón: lo que se pierde al bajar del layout grande al siguiente más pequeño. */
function Step({ big, small }) {
  const lostCount = removedKeys(big.id, small.id).size;
  return (
    <article className="card grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" aria-labelledby={`paso-${small.id}`}>
      <div>
        <Removed from={big.id} to={small.id} />
        <div className="mt-3">
          <Legend />
        </div>
      </div>
      <div>
        <p className="eyebrow">
          De {big.name} a {small.name}
        </p>
        <h3 id={`paso-${small.id}`} className="mt-1 font-display text-2xl font-bold">
          {small.name} <span className="text-base font-medium text-tone-400">· {small.alias}</span>
        </h3>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          <Fact label="Teclas">{small.keys}</Fact>
          <Fact label="Ancho">~{small.widthCm} cm</Fact>
          <Fact label="Aprendizaje">{small.learningCurve}</Fact>
        </dl>
        <h4 className="mt-5 text-sm font-semibold">Qué se pierde ({lostCount} teclas)</h4>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-tone-300">
          {small.removes.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h4 className="mt-4 text-sm font-semibold">Qué conserva</h4>
        <p className="mt-1 text-sm text-tone-300">{small.keeps.join(' · ')}</p>
        <h4 className="mt-4 text-sm font-semibold">Para quién es</h4>
        <p className="mt-1 text-sm text-tone-300">{small.recommendedFor}</p>
        <Link to={`/tienda?layout=${encodeURIComponent(small.id)}`} className="btn btn-secondary mt-5">
          Ver piezas {small.name} <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export default function LayoutGuide() {
  const { data: layouts, error, loading, reload } = useApi(() => api.layouts(), []);
  // La API devuelve de menor a mayor; la escalera baja desde el full-size
  const ladder = layouts ? [...layouts].reverse() : [];
  const full = ladder[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header>
        <p className="eyebrow">Guía de layouts</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">¿Cuál es la diferencia?</h1>
        <p className="mt-3 max-w-2xl text-tone-400">
          Un layout es el tamaño y la distribución de las teclas. Cada formato más pequeño quita un bloque del anterior: menos espacio en el escritorio, a cambio de mover algunas teclas a
          una capa con la tecla Fn. Aquí ves exactamente qué desaparece en cada paso.
        </p>
      </header>

      {error && (
        <div className="mt-8">
          <ErrorState error={error} onRetry={reload} />
        </div>
      )}
      {loading && !layouts && <div className="mt-8 h-96 animate-pulse rounded-2xl bg-tone-900" aria-label="Cargando layouts" />}

      {layouts && (
        <>
          <nav aria-label="Tamaños" className="mt-8 flex flex-wrap gap-2">
            {layouts.map((l) => (
              <a key={l.id} href={`#paso-${l.id}`} className="chip">
                {l.name} · {l.keys} teclas
              </a>
            ))}
          </nav>

          <div className="mt-8">
            <Comparator layouts={layouts} />
          </div>

          <h2 className="mt-14 font-display text-2xl font-bold">Paso a paso, de full-size a 40 %</h2>
          {full && (
            <article className="card mt-6 grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" aria-labelledby={`paso-${full.id}`}>
              <KeyboardPreview layout={full.id} caseColor={CASE} colors={PREVIEW_COLORS} legends className="w-full" title="Teclado full-size" />
              <div>
                <p className="eyebrow">El punto de partida</p>
                <h3 id={`paso-${full.id}`} className="mt-1 font-display text-2xl font-bold">
                  {full.name} <span className="text-base font-medium text-tone-400">· {full.alias}</span>
                </h3>
                <dl className="mt-4 grid grid-cols-3 gap-3">
                  <Fact label="Teclas">{buildLayout(full.id).keyCount}</Fact>
                  <Fact label="Ancho">~{full.widthCm} cm</Fact>
                  <Fact label="Aprendizaje">{full.learningCurve}</Fact>
                </dl>
                <p className="mt-4 text-sm text-tone-300">{full.description}</p>
                <h4 className="mt-4 text-sm font-semibold">Para quién es</h4>
                <p className="mt-1 text-sm text-tone-300">{full.recommendedFor}</p>
              </div>
            </article>
          )}
          <div className="mt-6 space-y-6">
            {ladder.slice(1).map((small, i) => (
              <Step key={small.id} big={ladder[i]} small={small} />
            ))}
          </div>

          <div className="card mt-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg">¿Ya sabes cuál es el tuyo?</p>
            <Link to="/armar" className="btn btn-primary">
              Arma tu teclado <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
