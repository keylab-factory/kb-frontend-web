import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useCart } from '../context/CartContext.jsx';
import KeyboardPreview from '../components/KeyboardPreview.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import { ErrorState } from '../components/ui.jsx';
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, CartIcon, CheckIcon, InfoIcon } from '../components/icons.jsx';
import { formatCOP } from '../utils/format.js';

const STORAGE_KEY = 'keylab.build.v1';

const STEPS = [
  { key: 'layout', label: 'Layout', hint: 'El tamaño define cuántas teclas tendrá y qué piezas encajan.' },
  { key: 'case', category: 'cases', label: 'Case', hint: 'La carcasa: material, peso y tipo de montaje cambian el sonido.' },
  { key: 'pcb', category: 'pcbs', label: 'PCB', hint: 'Hot-swap te deja cambiar switches sin soldar.' },
  { key: 'plate', category: 'plates', label: 'Plate', hint: 'Materiales rígidos suenan brillantes; los flexibles, suaves.' },
  { key: 'switches', category: 'switches', label: 'Switches', hint: 'Calculamos los paquetes de 10 que necesita tu layout.' },
  { key: 'keycaps', category: 'keycaps', label: 'Keycaps', hint: 'Solo mostramos sets que cubren tu layout.' },
  { key: 'stabilizers', category: 'stabilizers', label: 'Estabilizadores', hint: 'Para espacio, shift, enter y backspace.' },
];
const PART_STEPS = STEPS.filter((s) => s.category);
const EMPTY_BUILD = { layout: '65%', parts: {} };

function loadBuild() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.layout ? { layout: saved.layout, parts: saved.parts ?? {} } : EMPTY_BUILD;
  } catch {
    return EMPTY_BUILD;
  }
}

const fitsLayout = (p, layout) => (p.layout ? p.layout === layout : p.compat ? p.compat.includes(layout) : true);

function partDetail(p) {
  switch (p.category) {
    case 'cases':
      return `${p.mount} · ${p.specs.Material}`;
    case 'pcbs':
      return `${p.hotswap ? 'Hot-swap' : 'Soldable'} · ${p.fivePin ? '3 y 5 pines' : 'Solo 3 pines'}`;
    case 'plates':
      return `${p.material} · ${p.plateStabs ? 'acepta stabs plate-mount' : 'solo stabs PCB-mount'}`;
    case 'switches':
      return `${p.switchType} · ${p.force} g · ${p.pins} pines`;
    case 'keycaps':
      return `Perfil ${p.profile} · ${p.material}`;
    case 'stabilizers':
      return p.mount === 'pcb' ? 'PCB-mount (screw-in)' : 'Plate-mount (clip-in)';
    default:
      return '';
  }
}

// Aviso previo en la tarjeta, antes de elegir. El servidor hace la validación definitiva.
function conflictWith(p, selected) {
  const { pcb, plate, switches, stabilizers } = selected;
  if (p.category === 'stabilizers' && p.mount === 'plate' && plate && !plate.plateStabs) return { level: 'error', text: 'Tu plate no acepta este montaje' };
  if (p.category === 'plates' && !p.plateStabs && stabilizers?.mount === 'plate') return { level: 'error', text: 'No acepta tus estabilizadores' };
  if (p.category === 'switches' && p.pins === 5 && pcb && !pcb.fivePin) return { level: 'warning', text: 'Tu PCB es de 3 pines' };
  if (p.category === 'pcbs' && !p.fivePin && switches?.pins === 5) return { level: 'warning', text: 'Tus switches son de 5 pines' };
  if (p.category === 'pcbs' && !p.hotswap) return { level: 'warning', text: 'Requiere soldar' };
  return null;
}

function OptionCard({ product, selected, onSelect, conflict, priceNote }) {
  const soldOut = product.stock <= 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={soldOut}
      aria-pressed={selected}
      className={`relative flex flex-col overflow-hidden rounded-2xl border text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        selected ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500' : 'border-tone-800 bg-tone-900/60 hover:border-tone-600'
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-zinc-950">
          <CheckIcon className="h-4 w-4" />
        </span>
      )}
      <div className={`flex h-32 items-center justify-center bg-tone-800/30 ${['switches', 'stabilizers'].includes(product.category) ? 'p-7' : 'p-4'}`}>
        <ProductVisual product={product} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold leading-snug">{product.name}</p>
        <p className="mt-1 text-xs text-tone-400">{partDetail(product)}</p>
        {conflict && (
          <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${conflict.level === 'error' ? 'text-red-400' : 'text-amber-300'}`}>
            <AlertIcon className="h-3.5 w-3.5" /> {conflict.text}
          </p>
        )}
        <div className="mt-auto pt-3">
          <p className="font-bold tabular-nums">{soldOut ? 'Agotado' : formatCOP(product.price)}</p>
          {priceNote && <p className="text-xs text-tone-500">{priceNote}</p>}
        </div>
      </div>
    </button>
  );
}

function LayoutStep({ layouts, value, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {layouts.map((l) => {
        const active = value === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            aria-pressed={active}
            className={`rounded-2xl border p-5 text-left transition-colors ${active ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500' : 'border-tone-800 bg-tone-900/60 hover:border-tone-600'}`}
          >
            <KeyboardPreview layout={l.id} caseColor={active ? '#52525b' : '#3f3f46'} colors={{ alpha: '#a1a1aa', mod: '#71717a', accent: active ? '#f97316' : '#a1a1aa' }} className="w-full" />
            <div className="mt-4 flex items-baseline justify-between">
              <p className="font-display text-xl font-bold">{l.name}</p>
              <p className="text-sm text-tone-400">{l.keys} teclas</p>
            </div>
            <p className="mt-1 text-sm text-tone-400">{l.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export default function Builder() {
  const navigate = useNavigate();
  const { addMany } = useCart();
  const [build, setBuild] = useState(loadBuild);
  const [stepIndex, setStepIndex] = useState(0);
  const [validation, setValidation] = useState(null);

  const layouts = useApi(() => api.layouts(), []);
  const catalog = useApi(() => api.products({ limit: 100 }), []);

  const byId = useMemo(() => Object.fromEntries((catalog.data?.items ?? []).map((p) => [p.id, p])), [catalog.data]);
  const selected = useMemo(
    () => Object.fromEntries(Object.entries(build.parts).map(([slot, id]) => [slot, byId[id]]).filter(([, p]) => p)),
    [build.parts, byId],
  );
  const layout = layouts.data?.find((l) => l.id === build.layout);
  const switchPacks = layout ? Math.ceil(layout.keys / 10) : 0;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(build));
    } catch {
      // sin almacenamiento disponible
    }
  }, [build]);

  // Validación en el servidor (fuente de verdad de precios y compatibilidad).
  // Se guarda la versión del build validada para no usar un resultado viejo.
  const buildKey = JSON.stringify(build);
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      api
        .validateBuild(JSON.parse(buildKey))
        .then((result) => alive && setValidation({ ...result, key: buildKey }))
        .catch(() => alive && setValidation(null));
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [buildKey]);

  function chooseLayout(layoutId) {
    // Al cambiar de layout se descartan las piezas que ya no encajan
    const parts = Object.fromEntries(Object.entries(build.parts).filter(([, id]) => byId[id] && fitsLayout(byId[id], layoutId)));
    setBuild({ layout: layoutId, parts });
  }

  function choosePart(slot, id) {
    setBuild((b) => ({ ...b, parts: { ...b.parts, [slot]: b.parts[slot] === id ? undefined : id } }));
  }

  function addToCart() {
    const lines = validation.lines.map((l) => ({ product: byId[l.productId], quantity: l.quantity }));
    addMany(lines, `Tu build ${build.layout} se agregó al carrito`);
    navigate('/carrito');
  }

  const step = STEPS[stepIndex];
  const options = step.category ? (catalog.data?.items ?? []).filter((p) => p.category === step.category && fitsLayout(p, build.layout)) : [];
  const error = layouts.error ?? catalog.error;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={error} onRetry={() => { layouts.reload(); catalog.reload(); }} />
      </div>
    );
  }

  const issues = validation?.issues ?? [];
  const canAdd = validation?.key === buildKey && validation.valid && validation.lines.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Armador</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Arma tu teclado</h1>
          <p className="mt-2 max-w-2xl text-tone-400">Elige cada pieza y verificamos que todo encaje. Tu progreso se guarda en este navegador.</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setBuild(EMPTY_BUILD);
            setStepIndex(0);
          }}
        >
          Empezar de nuevo
        </button>
      </header>

      <ol className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Pasos">
        {STEPS.map((s, i) => {
          const done = s.key === 'layout' ? Boolean(build.layout) : Boolean(selected[s.key]);
          const active = i === stepIndex;
          return (
            <li key={s.key} className="shrink-0">
              <button
                type="button"
                onClick={() => setStepIndex(i)}
                aria-current={active ? 'step' : undefined}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? 'border-brand-500 bg-brand-500/10 text-tone-50' : 'border-tone-800 text-tone-400 hover:border-tone-600 hover:text-tone-200'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-emerald-500 text-zinc-950' : 'bg-tone-800 text-tone-400'}`}>
                  {done ? <CheckIcon className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section aria-labelledby="step-title">
          <div className="mb-5">
            <h2 id="step-title" className="font-display text-xl font-bold">
              {stepIndex + 1}. {step.label}
            </h2>
            <p className="text-sm text-tone-400">{step.hint}</p>
          </div>

          {step.key === 'layout' ? (
            <LayoutStep layouts={layouts.data ?? []} value={build.layout} onChange={chooseLayout} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {options.map((p) => (
                <OptionCard
                  key={p.id}
                  product={p}
                  selected={build.parts[step.key] === p.id}
                  onSelect={() => choosePart(step.key, p.id)}
                  conflict={conflictWith(p, selected)}
                  priceNote={p.category === 'switches' ? `× ${switchPacks} paquetes = ${formatCOP(p.price * switchPacks)}` : undefined}
                />
              ))}
              {catalog.loading && !options.length && Array.from({ length: 3 }, (_, i) => <div key={i} className="card h-64 animate-pulse" />)}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setStepIndex((i) => i - 1)} disabled={stepIndex === 0}>
              <ArrowLeftIcon className="h-4 w-4" /> Anterior
            </button>
            {step.category && selected[step.key] && (
              <button type="button" className="btn btn-ghost text-sm" onClick={() => choosePart(step.key, build.parts[step.key])}>
                Ya lo tengo / quitar
              </button>
            )}
            {stepIndex < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStepIndex((i) => i + 1)}>
                Siguiente <ArrowRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={addToCart} disabled={!canAdd}>
                <CartIcon className="h-4 w-4" /> Agregar al carrito
              </button>
            )}
          </div>
        </section>

        <aside className="card p-5 lg:sticky lg:top-24">
          <KeyboardPreview
            layout={build.layout}
            caseColor={selected.case?.visual.case ?? '#3f3f46'}
            colors={selected.keycaps?.visual}
            blank={!selected.keycaps}
            switchColor={selected.switches?.visual.stem}
            legends={Boolean(selected.keycaps)}
            className="w-full"
            title="Vista previa de tu build"
          />

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-semibold">Tu build {build.layout}</span>
            {layout && <span className="text-tone-400">{layout.keys} teclas</span>}
          </div>

          <ul className="mt-3 divide-y divide-tone-800 text-sm">
            {PART_STEPS.map((s) => {
              const line = validation?.lines.find((l) => l.slot === s.key);
              const part = selected[s.key];
              return (
                <li key={s.key} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs text-tone-500">{s.label}</p>
                    <button type="button" className={`truncate text-left ${part ? 'text-tone-200 hover:text-tone-50' : 'text-tone-500 italic hover:text-tone-300'}`} onClick={() => setStepIndex(STEPS.indexOf(s))}>
                      {part?.name ?? 'Sin elegir'}
                    </button>
                  </div>
                  {line && (
                    <div className="shrink-0 text-right tabular-nums">
                      <p>{formatCOP(line.subtotal)}</p>
                      {line.quantity > 1 && <p className="text-xs text-tone-500">{line.quantity} × {formatCOP(line.unitPrice)}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {issues.length > 0 && (
            <ul className="mt-3 space-y-2">
              {issues.map((issue, i) => (
                <li
                  key={i}
                  className={`flex gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed ${issue.level === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-200'}`}
                >
                  <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {issue.message}
                </li>
              ))}
            </ul>
          )}

          {validation && !validation.complete && validation.lines.length > 0 && issues.length === 0 && (
            <p className="mt-3 flex gap-2 rounded-lg bg-tone-800/60 px-3 py-2 text-xs text-tone-300">
              <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Te faltan {validation.missing.length} pieza(s). Puedes comprar solo lo que necesites.
            </p>
          )}

          <div className="mt-4 flex items-baseline justify-between border-t border-tone-800 pt-4">
            <span className="text-tone-400">Total</span>
            <span className="text-2xl font-bold tabular-nums">{formatCOP(validation?.total ?? 0)}</span>
          </div>
          <button type="button" className="btn btn-primary mt-4 w-full py-3" onClick={addToCart} disabled={!canAdd}>
            <CartIcon className="h-5 w-5" /> Agregar build al carrito
          </button>
          {validation && !validation.valid && <p className="mt-2 text-center text-xs text-red-300">Corrige los problemas marcados para continuar.</p>}
        </aside>
      </div>
    </div>
  );
}
