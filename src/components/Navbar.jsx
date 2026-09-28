import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useCart } from '../context/CartContext.jsx';
import { CartIcon, CloseIcon, Logo, MenuIcon } from './icons.jsx';
import ThemeMenu from './ThemeMenu.jsx';

const LINKS = [
  { to: '/tienda', label: 'Tienda' },
  { to: '/armar', label: 'Arma tu teclado' },
  { to: '/layouts', label: 'Layouts' },
  { to: '/comparador', label: 'Comparador' },
];

const linkClass = ({ isActive }) =>
  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-tone-800 text-tone-50' : 'text-tone-400 hover:text-tone-50'}`;

export default function Navbar() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-tone-800/80 bg-tone-950/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="KeyLab, inicio">
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight">KEYLAB</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <ThemeMenu />
          <Link
            to="/carrito"
            className="relative rounded-lg p-2.5 text-tone-300 transition-colors hover:bg-tone-800 hover:text-tone-50"
            aria-label={`Carrito: ${count} productos`}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-zinc-950">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-lg p-2.5 text-tone-300 hover:bg-tone-800 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-tone-800 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
