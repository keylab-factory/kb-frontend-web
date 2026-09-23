// Etiquetas de las categorías (mismos ids que el servidor y el scraper)
export const CATEGORY_LABELS = {
  keyboards: 'Teclados armados',
  cases: 'Cases',
  pcbs: 'PCBs',
  plates: 'Plates',
  switches: 'Switches',
  keycaps: 'Keycaps',
  stabilizers: 'Estabilizadores',
  accessories: 'Accesorios',
};

export const categoryLabel = (id) => CATEGORY_LABELS[id] ?? id;

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Destacados' },
  { id: 'price_asc', label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
  { id: 'rating', label: 'Mejor calificados' },
  { id: 'name', label: 'Nombre' },
];
