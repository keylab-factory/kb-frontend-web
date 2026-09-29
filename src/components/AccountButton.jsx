import { Link } from 'react-router';
import { useSession } from '../auth/session.js';
import { UserIcon } from './icons.jsx';

const iconButton = 'flex items-center gap-2 rounded-lg p-2.5 text-tone-300 transition-colors hover:bg-tone-800 hover:text-tone-50';

/** Acceso a la cuenta en la barra superior. No aparece si no hay cuentas configuradas. */
export default function AccountButton() {
  const session = useSession();
  if (!session.provider) return null;
  if (!session.loaded) return <span className="h-10 w-10" aria-hidden="true" />;

  if (!session.signedIn) {
    return (
      <button type="button" className={iconButton} onClick={session.signIn} aria-label="Iniciar sesión">
        <UserIcon />
        <span className="hidden text-sm font-medium lg:inline" aria-hidden="true">
          Iniciar sesión
        </span>
      </button>
    );
  }

  const initial = (session.user.name || session.user.email || '?').trim().charAt(0).toUpperCase();
  return (
    <Link to="/cuenta" className={iconButton} aria-label="Mi cuenta">
      {session.user.imageUrl ? (
        <img src={session.user.imageUrl} alt="" className="h-6 w-6 rounded-full" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-zinc-950">{initial}</span>
      )}
      <span className="hidden text-sm font-medium lg:inline">Mi cuenta</span>
    </Link>
  );
}
