# 02 · Arquitectura

## Visión general
```
 Móvil (PWA React)
   │  supabase-js (anon key + JWT)          POST /api/sync-sheet
   ├──────────────────────────────► Supabase ◄──────────── Vercel Function
   │                                (Postgres + RLS)          │ lee CSV
   │                                     ▲                    ▼
   │                                     │ service role   Google Sheet
   │                                     │                (pestaña "app")
   │                     pg_cron 03:00 ──┴── GET /api/cron-sync
```

## Modelo de datos
| Tabla | Qué guarda | Claves |
|-------|-----------|--------|
| `wallets` | Carteras y su saldo actual | `type`: bank/ewallet/poker/cash · `source`: manual/sheet |
| `wallet_snapshots` | Saldo de cada cartera por día | PK (`wallet_id`, `day`) |
| `categories` | Categorías libres por usuario | `kind`: income/expense |
| `recurring_items` | Plantillas de fijos | `default_amount`, `day_of_month` |
| `transactions` | Movimientos del mes | `status`: pending/paid · `wallet_id` al pagar |

Todas llevan `user_id` (por defecto `auth.uid()`).

## Reglas de negocio
1. **Sin transferencias**: mover dinero entre carteras = editar saldos a mano.
2. **Obligación**: un movimiento `pending` cuenta en "obligaciones del mes".
3. **Pagar**: `status = paid` + `wallet_id` + `paid_at` → el trigger
   `tx_apply_balance` resta (gasto) o suma (ingreso) en esa cartera.
4. **Revertir**: desmarcar, editar importe/cartera o borrar un pagado →
   el trigger deshace el efecto anterior y aplica el nuevo.
5. **Fijos**: `generate_month(mes)` crea los del mes con el importe por defecto;
   no duplica (índice único `recurring_id + month`). Día 31 → último día del mes.
6. **Disponible real** = total carteras − gastos pendientes + ingresos pendientes.
7. **Poker**: una sola cartera con el **total** de todas las salas (ya en €).
   El P/L del día es informativo, no crea movimientos.
8. **Histórico**: cada cambio de saldo hace upsert en `wallet_snapshots`
   (1 foto/día, hora Madrid).

## Triggers y funciones
| Nombre | Tipo | Qué hace |
|--------|------|----------|
| `tx_apply_balance` | Trigger `transactions` | Mueve saldo al pagar/despagar/editar/borrar |
| `wallet_snapshot` | Trigger `wallets` | Foto diaria del saldo |
| `generate_month(date)` | RPC | Crea fijos del mes |
| `get_dashboard(date)` | RPC | Total, pendientes, disponible, P/L poker |
| `get_net_worth_history(int)` | RPC | Patrimonio a fin de mes (N meses) |
| `v_category_totals` | Vista | Total por categoría y mes |
| `v_month_totals` | Vista | Ingresos vs gastos por mes |

## Seguridad
- **RLS** en todas las tablas: `user_id = auth.uid()`.
- Vistas con `security_invoker = true` → respetan RLS.
- El trigger valida que la cartera de pago sea del mismo usuario.
- `service_role` solo en Vercel (sync del Sheet).
- `/api/cron-sync` exige `Authorization: Bearer CRON_SECRET`.
- `/api/sync-sheet` exige el JWT del usuario y solo toca sus carteras.
- El CSV publicado solo contiene 2 celdas (pestaña `app`), no la hoja entera.

## Estructura de carpetas
```
api/            funciones Vercel
src/lib/        cliente Supabase y llamadas
src/types/      tipos TS de la BD
src/pages/      pantallas
src/components/ componentes compartidos
supabase/       SQL (esquema y cron)
docs/           esta documentación
```
