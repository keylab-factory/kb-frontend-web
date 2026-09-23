import { Link } from 'react-router';
import { useFx } from '../hooks/useFx.js';
import { formatCOP, formatShortDate } from '../utils/format.js';
import { Logo } from './icons.jsx';

export default function Footer() {
  const { data: fx } = useFx();

  return (
    <footer className="mt-24 border-t border-tone-800/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="font-display font-bold tracking-tight">KEYLAB</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-tone-400">
            Teclados mecánicos custom y componentes para armar el tuyo. Envíos a toda Colombia.
          </p>
          {fx && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-tone-800 px-3 py-1 text-xs text-tone-400" title={fx.source}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Dólar hoy ({fx.kind}): <strong className="font-semibold text-tone-200">{formatCOP(fx.rate)}</strong>
              {fx.date && <span className="text-tone-500">· {formatShortDate(fx.date)}</span>}
            </p>
          )}
          <p className="mt-4 text-xs text-tone-500">Proyecto académico: los pagos son simulados y no se cobra nada.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-tone-200">Tienda</h3>
          <ul className="mt-3 space-y-2 text-sm text-tone-400">
            <li><Link className="hover:text-tone-50" to="/tienda?categoria=keyboards">Teclados armados</Link></li>
            <li><Link className="hover:text-tone-50" to="/tienda?categoria=switches">Switches</Link></li>
            <li><Link className="hover:text-tone-50" to="/tienda?categoria=keycaps">Keycaps</Link></li>
            <li><Link className="hover:text-tone-50" to="/tienda?categoria=cases">Cases</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-tone-200">Herramientas</h3>
          <ul className="mt-3 space-y-2 text-sm text-tone-400">
            <li><Link className="hover:text-tone-50" to="/armar">Armador de teclados</Link></li>
            <li><Link className="hover:text-tone-50" to="/comparador">Comparador de mercado</Link></li>
            <li><Link className="hover:text-tone-50" to="/carrito">Carrito</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
