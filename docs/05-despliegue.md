# 05 · Despliegue

Orden: Supabase → Local → Google Sheet → Vercel → Cron.

## 1. Supabase
1. supabase.com → **New project** (región: EU West).
2. **SQL Editor** → pega `supabase/01_schema.sql` → **Run**.
3. **Settings → API** → copia `Project URL`, `anon key`, `service_role key`.
4. **Authentication → URL Configuration** → Site URL = URL de Vercel.

## 2. Local
```bash
npm install
cp .env.example .env.local      # rellena las VITE_*
npm run dev
```
`/api/*` en local: `npx vercel dev`.

## 3. Google Sheet
1. Crea una pestaña **`app`** en tu Excel:

   | Celda | Fórmula | Valor |
   |-------|---------|-------|
   | `A1` | `='TuPestaña'!CELDA_SALDO` | Saldo total poker en € |
   | `B1` | `='TuPestaña'!CELDA_PL` | Profit/pérdida del día |

2. **Archivo → Compartir → Publicar en la web**.
3. Elige la pestaña **app** (no "Documento entero") → formato **CSV** → Publicar.
4. Copia el enlace (`.../pub?gid=...&single=true&output=csv`).
5. Pégalo en la cartera Poker de la app.

> Solo esas 2 celdas son públicas para quien tenga el enlace.

## 4. Vercel
1. Sube el proyecto a GitHub.
2. vercel.com → **Add New → Project** → importa el repo (detecta Vite).
3. **Settings → Environment Variables**:

   | Variable | Valor |
   |----------|-------|
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `CRON_SECRET` | `openssl rand -hex 32` |

4. **Deploy**.

## 5. Cron 03:00 Madrid
1. Supabase **SQL Editor** → abre `supabase/02_cron.sql`.
2. Cambia `https://TU-APP.vercel.app/api/cron-sync` y el secreto.
3. **Run**.
4. Prueba manual:
   ```bash
   curl -H "Authorization: Bearer TU_CRON_SECRET" https://TU-APP.vercel.app/api/cron-sync
   ```
5. Al día siguiente:
   ```sql
   select * from cron.job_run_details order by start_time desc limit 5;
   select status_code, content from net._http_response order by created desc limit 5;
   ```

**Por qué pg_cron y no Vercel Cron**: en el plan Hobby, Vercel Cron va en UTC
y se ejecuta en cualquier minuto dentro de la hora. pg_cron se lanza a las
01:00 y 02:00 UTC y solo actúa cuando en Madrid son las 03:00 → exacto todo el año.

## Problemas comunes
| Síntoma | Causa | Solución |
|---------|-------|----------|
| 401 en `/api/cron-sync` | Secreto distinto | Mismo valor en Vercel y Vault |
| "Valor no numérico" | Celda con texto | Revisa A1/B1 de la pestaña `app` |
| 404 en rutas al recargar | Falta rewrite | Revisa `vercel.json` |
| No ve datos tras login | RLS / sesión | Cierra sesión y entra de nuevo |
