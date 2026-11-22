# Mis Gastos — Vite + React + Supabase + Vercel (PWA)

📚 Documentación completa en [`docs/`](docs/README.md) · Roadmap en [`docs/03-fases.md`](docs/03-fases.md)

## 1. Supabase
1. Crea el proyecto en supabase.com.
2. SQL Editor → pega `supabase/01_schema.sql` → Run.
3. Settings → API → copia `URL`, `anon key` y `service_role key`.

## 2. Local
```bash
npm install
cp .env.example .env.local   # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```
> `/api/*` solo funciona en Vercel o con `npx vercel dev`.

## 3. Google Sheet (saldo poker)
1. En tu Excel crea una pestaña `app`:
   - `A1` → `='TuPestaña'!CELDA_SALDO_TOTAL` (en €)
   - `B1` → `='TuPestaña'!CELDA_PROFIT_DIA`
2. Archivo → Compartir → Publicar en la web → pestaña **app** → **CSV** → Publicar.
3. Copia el enlace. En la app crea la cartera Poker con origen "sheet" y pega el enlace.

## 4. Vercel
1. Sube el repo a GitHub e impórtalo en Vercel (detecta Vite solo).
2. Settings → Environment Variables:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (genera uno: `openssl rand -hex 32`).
3. Deploy.

## 5. Cron diario 03:00 Madrid
SQL Editor → pega `supabase/02_cron.sql` cambiando la URL de Vercel y el `CRON_SECRET` → Run.

Prueba manual:
```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" https://TU-APP.vercel.app/api/cron-sync
```

## Estructura
```
api/                 funciones Vercel
  _lib/sheet.ts      lectura CSV + parseo "1.234,56 €"
  _lib/sync.ts       actualiza carteras sheet (service role)
  cron-sync.ts       GET  — llamado por pg_cron
  sync-sheet.ts      POST — botón Refrescar (usuario logueado)
src/
  lib/               cliente Supabase + llamadas (markPaid, generateMonth…)
  types/db.ts        tipos de las tablas
  pages/             Login, Dashboard, (resto pendiente)
  components/        Layout con tab bar móvil
supabase/
  01_schema.sql      tablas, triggers, RPC, vistas, RLS
  02_cron.sql        pg_cron + pg_net a las 03:00 Madrid
```

## Pendiente
- Iconos PWA: `public/icon-192.png` y `public/icon-512.png`
- Pantallas: Movimientos del mes, Carteras, Fijos, Categorías, gráficos
