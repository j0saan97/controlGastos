# 06 · Decisiones

Registro de decisiones (ADR resumido).

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| D01 | Solo € | Simplicidad; ACR ya se convierte en el Excel | Multi-divisa con tipo de cambio |
| D02 | Entrada manual | Control total, sin APIs bancarias | GoCardless / importar CSV |
| D03 | Sin transferencias | Se editan saldos a mano | Tabla `transfers` |
| D04 | Poker = 1 cartera (total) | El detalle por sala ya está en el Excel | 1 cartera por sala |
| D05 | Sheet por CSV publicado (solo pestaña `app`) | Rápido; solo expone 2 celdas | OAuth Google (→ `F11-01`) |
| D06 | Saldo movido por trigger en BD | Nunca se descuadra aunque falle el front | Calcular en el front |
| D07 | Importes positivos + `kind` | Evita errores de signo | Importes con signo |
| D08 | `month` = día 1 del mes | Agrupar y filtrar fácil | Año + mes en 2 columnas |
| D09 | Foto diaria de saldos | Necesaria para evolución sin transferencias | Recalcular desde movimientos |
| D10 | Cron con pg_cron (Supabase) | Hora exacta Madrid, cambio de hora incluido, gratis | Vercel Cron (UTC, ±59 min en Hobby) |
| D11 | Categorías libres | Cada usuario las organiza a su manera | Lista fija por defecto |
| D12 | PWA móvil primero | Apuntar gastos en el momento | Escritorio |
| D13 | Multiusuario con RLS | Abierta a registro, datos aislados | Usuario único |
| D14 | Responsive: móvil primero + PC (≥ 900px menú lateral) | Revisar datos y gráficos cómodamente en el PC con la misma app | Solo móvil · App de escritorio aparte |
