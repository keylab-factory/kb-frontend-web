import { useEffect, useState } from 'react';

const STORAGE_KEY = 'keylab.theme';
const THEME_COLORS = { light: '#f6f6f7', dark: '#09090b' };

export const THEME_OPTIONS = ['light', 'dark', 'system'];

function loadPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEME_OPTIONS.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Preferencia de tema: 'light' (día), 'dark' (noche) o 'system' (sigue al sistema operativo).
 * Aplica el tema resuelto en <html data-theme> y lo recuerda en localStorage.
 */
export function useTheme() {
  const [preference, setPreference] = useState(loadPreference);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const theme = preference === 'system' ? (media.matches ? 'light' : 'dark') : preference;
      document.documentElement.setAttribute('data-theme', theme);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
    };
    apply();

    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // sin almacenamiento: el tema dura solo esta visita
    }

    if (preference !== 'system') return undefined;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  return [preference, setPreference];
}
