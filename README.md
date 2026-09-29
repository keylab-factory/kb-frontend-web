# KeyLab: tienda web

Frontend de KeyLab: catálogo, armador de teclados con validación de compatibilidad, guía de layouts, carrito, checkout y comparador de mercado.

**Stack:** React 19 · React Router 8 · Vite 8 · Tailwind CSS 4

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173; /api se reenvía al gateway en http://localhost:4000
npm run build    # compila a dist/
```

Necesita el backend corriendo: [`kb-backend-services`](https://github.com/keylab-factory/kb-backend-services), un repositorio privado de la organización. El frontend habla **solo con el API Gateway**, nunca con un microservicio directamente. Por eso no se enteró de la migración a microservicios: la API pública es la misma de V1.

## Despliegue

En **Cloudflare Pages**, conectado a este repositorio:

- **Build:** comando `npm run build`, salida `dist`.
- **Variables:** `NODE_VERSION=24`, `VITE_API_URL=<gateway>/api` y `VITE_CLERK_PUBLISHABLE_KEY`.
- **Rutas:** [`public/_redirects`](public/_redirects) envía cualquier ruta a `index.html`, para que `/pedido/...` o `/admin` funcionen al recargar.

La guía completa, con el backend, está en `docs/DESPLIEGUE.md` de kb-backend-services.

## Pagos

Con Wompi activo en el backend, PSE y tarjeta llevan al Web Checkout de Wompi y vuelven a la página del pedido. Esa página se actualiza sola hasta que llega la confirmación, y permite reintentar un pago rechazado. El pedido solo se da por pagado cuando el backend recibe el aviso firmado de Wompi. Sin Wompi, la tienda dice que no se cobra nada.

## Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `VITE_API_URL` | `/api` | URL del gateway. Se cambia solo si el frontend se despliega en otro dominio; entonces el gateway debe incluirlo en `CORS_ORIGINS`. |
| `VITE_CLERK_PUBLISHABLE_KEY` | — | Activa las cuentas con Clerk (clave publicable, pública por diseño). |
| `VITE_AUTH_MODE` | — | `local`: cuentas contra el emisor de desarrollo del backend (`npm run dev:auth`), sin Clerk. Solo para desarrollo. |
| `VITE_DEV_AUTH_URL` | `http://localhost:4999` | Dirección de ese emisor. |

Sin ninguna de las variables de cuentas, todos compran como invitados. Plantilla: [`.env.example`](.env.example) → copiar como `.env.local`.

## Cuentas

Las páginas usan `useSession()` ([`src/auth/session.js`](src/auth/session.js)) y no saben qué proveedor hay debajo. El código de Clerk o de la sesión local se descarga solo si está configurado. `api.js` adjunta el token únicamente en las rutas de cuenta y pedidos. Con sesión, el carrito se sincroniza con la cuenta.

## Páginas

| Ruta | Página |
|---|---|
| `/` | Inicio |
| `/tienda` | Catálogo con filtros por categoría, layout (40 % a 100 %), precio y stock |
| `/producto/:id` | Ficha de producto |
| `/armar` | Armador paso a paso, con validación en el servidor |
| `/layouts` | Guía "¿Cuál es la diferencia?": comparador entre layouts y qué teclas se pierden en cada paso |
| `/carrito`, `/checkout`, `/pedido/:id` | Compra (con sesión, el checkout usa las direcciones guardadas) |
| `/cuenta` | Mi cuenta: pedidos, direcciones, builds guardados y datos personales |
| `/admin` | Panel de administración (solo rol admin): publicar borradores, precio y stock, y enviar, entregar o cancelar pedidos. Su código se descarga aparte |
| `/comparador` | Precios de tiendas internacionales (datos que publica la app de escritorio) |

Las ilustraciones de teclados son SVG generados a partir de la geometría de cada layout ([`src/data/layouts.js`](src/data/layouts.js)), sin fotografías. `removedKeys(desde, hasta)` calcula qué teclas desaparecen entre dos layouts para la guía.
