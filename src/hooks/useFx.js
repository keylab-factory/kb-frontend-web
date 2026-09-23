import { useEffect } from 'react';
import { api } from '../api.js';
import { useApi } from './useApi.js';

const REFRESH_MS = 10 * 60 * 1000;

/**
 * Precio del dólar (COP por USD) que mantiene actualizado el servidor.
 * La página lo vuelve a pedir cada 10 minutos, así una pestaña abierta no queda desactualizada.
 */
export function useFx() {
  const state = useApi(() => api.fx(), []);
  const { reload } = state;

  useEffect(() => {
    const timer = setInterval(reload, REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);

  return state;
}
