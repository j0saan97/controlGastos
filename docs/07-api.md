# 07 · API

## Vercel Functions

### `POST /api/sync-sheet`
Lee el Google Sheet de las carteras `sheet` del usuario logueado.

| | |
|---|---|
| Header | `Authorization: Bearer <access_token de Supabase>` |
| 200 | `{ "results": [{ "wallet_id": "...", "ok": true, "balance": 1234.56 }] }` |
| 401 | Sin token o token inválido |

### `GET /api/cron-sync`
Sincroniza **todas** las carteras `sheet`. Lo llama pg_cron a las 03:00.

| | |
|---|---|
| Header | `Authorization: Bearer <CRON_SECRET>` |
| 200 | `{ "synced": 3, "failed": [] }` |
| 401 | Secreto incorrecto |

## RPC Supabase (`supabase.rpc(...)`)

| Función | Parámetros | Devuelve |
|---------|-----------|----------|
| `generate_month` | `p_month: 'YYYY-MM-01'` | nº de fijos creados |
| `get_dashboard` | `p_month: 'YYYY-MM-01'` | `total_balance, pending_expenses, pending_income, available, poker_pnl` |
| `get_net_worth_history` | `p_months: 12` | `[{ month, total }]` |

## Vistas
| Vista | Columnas |
|-------|----------|
| `v_category_totals` | `month, kind, category_id, category, color, total, paid` |
| `v_month_totals` | `month, income, expense` |

## Helpers del front (`src/lib/api.ts`)
| Función | Qué hace |
|---------|----------|
| `getDashboard(month?)` | Llama a `get_dashboard` |
| `syncSheet()` | `POST /api/sync-sheet` con el token |
| `markPaid(txId, walletId)` | Marca pagado → trigger mueve saldo |
| `markPending(txId)` | Vuelve a pendiente → trigger revierte |
| `generateMonth(month?)` | Crea fijos del mes |
| `eur(n)` | Formato `1.234,56 €` |
