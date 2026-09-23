import { Link } from 'react-router';
import KeyboardPreview from '../components/KeyboardPreview.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <KeyboardPreview layout="60%" caseColor="#27272a" colors={{ alpha: '#3f3f46', mod: '#27272a', accent: '#f97316' }} className="w-64 opacity-80" />
      <p className="mt-8 font-mono text-sm text-brand-400">Error 404</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Esta tecla no hace nada</h1>
      <p className="mt-2 text-tone-400">La página que buscas no existe o cambió de lugar.</p>
      <Link to="/" className="btn btn-primary mt-8">
        Volver al inicio
      </Link>
    </div>
  );
}
