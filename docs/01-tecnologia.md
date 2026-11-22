# 01 · Tecnología

## Stack
| Capa | Tecnología | Uso |
|------|-----------|-----|
| Front | **React 18** + **TypeScript** | UI |
| Build | **Vite 5** | Dev server y bundle |
| PWA | **vite-plugin-pwa** (Workbox) | Instalable en el móvil, cache de la app |
| Routing | **react-router-dom 6** | Pestañas: Inicio, Mes, Carteras, Fijos, Categorías |
| Backend / BD | **Supabase** (PostgreSQL 15+) | Tablas, triggers, RPC, RLS |
| Auth | **Supabase Auth** | Email + contraseña |
| API | **Vercel Functions** (Node, `api/*.ts`) | Sync del Google Sheet |
| Cron | **Supabase pg_cron + pg_net** | Llama a Vercel a las 03:00 Madrid |
| Secretos cron | **Supabase Vault** | URL y token del cron |
| Hosting | **Vercel** (plan Hobby) | Front + funciones |
| Fuente poker | **Google Sheets** (CSV publicado) | Saldo total y P/L del día |

## Librerías
| Paquete | Para qué |
|---------|----------|
| `@supabase/supabase-js` | Cliente BD/Auth (front y API) |
| `react`, `react-dom` | UI |
| `react-router-dom` | Navegación |
| `vite-plugin-pwa` | Manifest + service worker |
| `typescript`, `@types/*` | Tipado |

> Pendiente elegir librería de gráficos (propuesta: **Recharts**) → tarea `F9-02`.

## Entornos
| Entorno | URL | Variables |
|---------|-----|-----------|
| Local | `http://localhost:5173` | `.env.local` |
| Producción | `https://TU-APP.vercel.app` | Vercel → Environment Variables |

## Variables de entorno
| Variable | Dónde | Pública |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Front | Sí |
| `VITE_SUPABASE_ANON_KEY` | Front | Sí (protegida por RLS) |
| `SUPABASE_URL` | API | No |
| `SUPABASE_SERVICE_ROLE_KEY` | API | **No — nunca en el front** |
| `CRON_SECRET` | API + Vault | No |

## Scripts
```bash
npm run dev        # desarrollo
npm run build      # tsc + vite build
npm run preview    # probar build
npm run typecheck  # solo tipos
npx vercel dev     # front + /api en local
```
