# 03 · Fases y tareas

Leyenda: `- [x]` hecho · `- [ ]` pendiente · código `F<fase>-<nº>`

## Progreso
| Fase | Nombre | Estado |
|------|--------|--------|
| F0 | Requisitos y diseño | ✅ Hecho |
| F1 | Base de datos | ✅ Hecho |
| F2 | Proyecto base y PWA | ✅ Hecho |
| F3 | Sync Google Sheet + cron | 🟡 Falta verificar el cron de las 03:00 |
| F4 | Auth y layout | ✅ Hecho |
| F5 | Carteras | ✅ Hecho (sync Poker se prueba en F3) |
| F6 | Categorías | ✅ Hecho |
| F7 | Fijos | ✅ Hecho |
| F8 | Movimientos del mes | ✅ Hecho (pendiente probar en real) |
| F9 | Dashboard y gráficos | ✅ Hecho (ejecutar `05_net_worth_groups.sql`) |
| F10 | Pulido y pruebas | 🟡 En curso |
| F11 | Futuro / ideas | ⬜ |

---

## F0 · Requisitos y diseño
- [x] **F0-01** Definir usuarios: multiusuario abierto
- [x] **F0-02** Definir carteras: banco, Skrill, Wise, poker (total), efectivo
- [x] **F0-03** Divisa única: € (ACR se convierte en el Excel)
- [x] **F0-04** Entrada manual, sin importación bancaria
- [x] **F0-05** Sin transferencias entre carteras
- [x] **F0-06** Flujo obligación → pagado eligiendo cartera
- [x] **F0-07** Fijos mensuales con importe por defecto editable
- [x] **F0-08** Categorías libres por usuario
- [x] **F0-09** Dashboard: disponible real, por categoría, evolución mensual
- [x] **F0-10** Poker desde Google Sheet (saldo total + P/L día)
- [x] **F0-11** Sync diario 03:00 Madrid

## F1 · Base de datos
- [x] **F1-01** Tablas `wallets`, `wallet_snapshots`, `categories`, `recurring_items`, `transactions`
- [x] **F1-02** Trigger `tx_apply_balance` (pagar / revertir)
- [x] **F1-03** Trigger `wallet_snapshot`
- [x] **F1-04** RPC `generate_month`
- [x] **F1-05** RPC `get_dashboard`
- [x] **F1-06** RPC `get_net_worth_history`
- [x] **F1-07** Vistas `v_category_totals`, `v_month_totals`
- [x] **F1-08** RLS en todas las tablas
- [x] **F1-09** Test local en PostgreSQL 16 (pagos, reversión, fijos, RLS)
- [x] **F1-10** Crear proyecto Supabase
- [x] **F1-11** Ejecutar `supabase/01_schema.sql`
- [x] **F1-12** Generar tipos: `npx supabase gen types typescript` → `src/lib/database.types.ts`

## F2 · Proyecto base y PWA
- [x] **F2-01** Scaffold Vite + React + TS
- [x] **F2-02** vite-plugin-pwa con manifest
- [x] **F2-03** `vercel.json` (SPA rewrites)
- [x] **F2-04** `.env.example`
- [x] **F2-05** Iconos `icon-192.png` y `icon-512.png` (+ `icon.svg` favicon, `apple-touch-icon.png`, maskable)
- [x] **F2-06** Repo GitHub (`j0saan97/controlGastos`, rama de trabajo `dev`)
- [x] **F2-07** Proyecto Vercel + variables de entorno
- [x] **F2-08** Primer deploy → https://control-gastos-six-mu.vercel.app
- [x] **F2-09** Instalar PWA en el móvil y comprobar
- [x] **F2-10** Comprobar contraseñas de `SECRETOS.md` (local, no se sube) contra Supabase/Vercel, rellenar contraseña de la BD y ~~rotar la secret key expuesta en capturas~~ → decidido no rotar, ver `06-decisiones.md` D15

## F3 · Sync Google Sheet + cron
- [x] **F3-01** Parser CSV + celdas + formato "1.234,56 €"
- [x] **F3-02** `api/_lib/sync.ts`
- [x] **F3-03** `POST /api/sync-sheet` (botón Refrescar)
- [x] **F3-04** `GET /api/cron-sync` con `CRON_SECRET`
- [x] **F3-05** `supabase/02_cron.sql` (pg_cron + pg_net + Vault)
- [x] ~~**F3-06** Crear pestaña `app` en el Excel (A1 saldo, B1 P/L)~~ → sustituida: cada sala lee su celda de la hoja existente
- [x] ~~**F3-07** Publicar pestaña como CSV~~ → sustituida: hoja compartida por enlace, la app convierte `edit?gid=` a CSV
- [ ] **F3-08** Ejecutar `02_cron.sql` con URL y secreto reales
- [x] **F3-09** Probar `curl` a `/api/cron-sync` → 200 `{"synced":4}`; sin secreto → 401
- [ ] **F3-10** Verificar ejecución a las 03:00 (`cron.job_run_details`)

## F4 · Auth y layout
- [x] **F4-01** Login / registro email + contraseña
- [x] **F4-02** Tab bar inferior móvil
- [x] **F4-03** Cerrar sesión
- [x] **F4-04** Recuperar contraseña (email con enlace → pantalla "Nueva contraseña")
- [x] **F4-06** Pantalla de bienvenida (sin carteras → crear la primera)
- [x] **F4-07** Layout responsive: ≥ 900px menú lateral, contenido máx. 960px, dashboard 4 columnas

## F5 · Carteras
- [x] **F5-01** Listado con saldo y total
- [x] **F5-02** Crear cartera (nombre, tipo, saldo inicial)
- [x] **F5-03** Editar saldo rápido (para mover dinero a mano)
- [x] **F5-04** Configurar cartera Poker (URL CSV, celdas)
- [x] **F5-05** Archivar / eliminar (solo si no tiene pagos)
- [x] **F5-06** Mostrar última sincronización y P/L del día

## F6 · Categorías
- [x] **F6-01** Listado separado ingresos / gastos
- [x] **F6-02** Crear con nombre y color
- [x] **F6-03** Editar
- [x] **F6-04** Eliminar (movimientos quedan "Sin categoría")

## F7 · Fijos
- [x] **F7-01** Listado de plantillas (activo / inactivo)
- [x] **F7-02** Crear (nombre, tipo, categoría, importe por defecto, día)
- [x] **F7-03** Editar / desactivar / eliminar
- [x] **F7-04** Botón "Generar fijos del mes"
- [x] **F7-05** Generar automáticamente al abrir un mes nuevo

## F8 · Movimientos del mes
- [x] **F8-01** Selector de mes (‹ noviembre 2026 ›)
- [x] **F8-02** Listado: pendientes arriba, pagados abajo
- [x] **F8-03** Crear movimiento variable (gasto / ingreso)
- [x] **F8-04** Editar importe y datos
- [x] **F8-05** Eliminar
- [x] **F8-06** Marcar pagado → modal elegir cartera
- [x] **F8-07** Desmarcar (vuelve a pendiente)
- [x] **F8-08** Filtros: tipo, categoría, fijo / variable, estado
- [x] **F8-09** Totales del mes en cabecera

## F9 · Dashboard y gráficos
- [x] **F9-01** Tarjetas: disponible real, total, pendientes, poker hoy
- [x] **F9-02** Elegir librería de gráficos (Recharts)
- [x] **F9-03** Gráfico gasto por categoría (mes)
- [x] **F9-04** Evolución patrimonio (12 meses)
- [x] **F9-05** Ingresos vs gastos por mes
- [x] **F9-06** Próximas obligaciones (7 días)

## F10 · Pulido y pruebas
- [x] **F10-01** Toasts de éxito / error
- [x] **F10-02** Estados de carga y vacío
- [x] **F10-03** Validación de formularios
- [x] **F10-04** Pantalla offline (sin conexión)
- [ ] **F10-05** Tests unitarios parser (`vitest`)
- [ ] **F10-06** Prueba con 2 usuarios reales (RLS)
- [ ] **F10-07** Revisar accesibilidad y tamaño táctil
- [x] **F10-08** Botón 👁 ocultar/mostrar saldos: importes como `••••` en Resumen y Carteras; recuerda la elección (localStorage)

## F11 · Futuro / ideas
- [ ] **F11-01** Google Sheets por OAuth (privado)
- [ ] **F11-02** Exportar a CSV / Excel
- [ ] **F11-03** Notificaciones de obligaciones próximas
- [ ] **F11-04** Presupuesto por categoría con aviso
- [ ] **F11-05** Adjuntar foto del ticket
