import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme.js';
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from './icons.jsx';

const OPTIONS = [
  { id: 'light', label: 'Día', hint: 'Colores claros', icon: SunIcon },
  { id: 'dark', label: 'Noche', hint: 'Colores oscuros', icon: MoonIcon },
  { id: 'system', label: 'Automático', hint: 'Igual que tu sistema', icon: MonitorIcon },
];

/** Menú desplegable para elegir el tema del sitio. */
export default function ThemeMenu() {
  const [preference, setPreference] = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);
  const current = OPTIONS.find((o) => o.id === preference) ?? OPTIONS[2];

  // Cierra al hacer clic fuera del menú
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Al abrir, el foco va a la opción activa
  useEffect(() => {
    if (open) itemRefs.current[OPTIONS.indexOf(current)]?.focus();
  }, [open, current]);

  function onMenuKeyDown(e) {
    const index = itemRefs.current.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = (index + (e.key === 'ArrowDown' ? 1 : -1) + OPTIONS.length) % OPTIONS.length;
      itemRefs.current[next]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  function choose(id) {
    setPreference(id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  const Icon = current.icon;
  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tema: ${current.label}. Cambiar tema`}
        title="Colores día / noche"
        className="rounded-lg p-2.5 text-tone-300 transition-colors hover:bg-tone-800 hover:text-tone-50"
      >
        <Icon />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Tema"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-50 mt-2 w-56 animate-fade-up rounded-xl border border-tone-700 bg-tone-900 p-1.5 shadow-2xl shadow-black/30"
        >
          {OPTIONS.map((option, i) => {
            const OptionIcon = option.icon;
            const checked = option.id === preference;
            return (
              <button
                key={option.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                onClick={() => choose(option.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-tone-800 focus-visible:bg-tone-800 ${
                  checked ? 'text-tone-50' : 'text-tone-300'
                }`}
              >
                <OptionIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1">
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-tone-500">{option.hint}</span>
                </span>
                {checked && <CheckIcon className="h-4 w-4 text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
