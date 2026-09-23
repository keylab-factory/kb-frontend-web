import { Link } from 'react-router';
import { useCart } from '../context/CartContext.jsx';
import { CheckIcon } from './icons.jsx';

export default function Toast() {
  const { toast } = useCart();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex animate-fade-up items-center gap-3 rounded-xl border border-tone-700 bg-tone-900/95 py-2.5 pr-2.5 pl-3.5 text-sm shadow-2xl shadow-black/50 backdrop-blur"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckIcon className="h-4 w-4" />
          </span>
          <span className="text-tone-200">{toast.message}</span>
          <Link to="/carrito" className="rounded-lg px-2.5 py-1 font-semibold text-brand-400 hover:bg-tone-800">
            Ver carrito
          </Link>
        </div>
      )}
    </div>
  );
}
