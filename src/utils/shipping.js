// Misma regla que el servidor (server/src/lib/orders.js). Aquí solo se usa para mostrar
// el estimado; el valor que se cobra lo calcula siempre el servidor.
export function shippingFor(subtotal, rules) {
  if (!rules) return 0;
  return subtotal === 0 || subtotal >= rules.freeFrom ? 0 : rules.flatRate;
}
