# 06 · Decisiones

Registro de decisiones (ADR resumido).

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| D01 | Solo € | Simplicidad; ACR ya se convierte en el Excel | Multi-divisa con tipo de cambio |
| D02 | Entrada manual | Control total, sin APIs bancarias | GoCardless / importar CSV |
| D03 | Sin transferencias | Se editan saldos a mano | Tabla `transfers` |
| D04 | ~~Poker = 1 cartera (total)~~ → **Carteras agrupadas**: grupo `BancaPoker` con una subcartera por sala; el grupo suma solo (trigger) | Ver el total y, al pinchar, de dónde sale cada saldo | 1 sola cartera con el total |
| D05 | ~~Sheet por CSV publicado (solo pestaña `app`)~~ → **Hoja compartida "cualquiera con el enlace"**; cada sala lee su celda (`edit?gid=` se convierte a CSV) | Usar el Excel tal cual, sin pestaña extra | Publicar pestaña `app` como CSV · OAuth Google (→ `F11-01`) |
| D06 | Saldo movido por trigger en BD | Nunca se descuadra aunque falle el front | Calcular en el front |
| D07 | Importes positivos + `kind` | Evita errores de signo | Importes con signo |
| D08 | `month` = día 1 del mes | Agrupar y filtrar fácil | Año + mes en 2 columnas |
| D09 | Foto diaria de saldos | Necesaria para evolución sin transferencias | Recalcular desde movimientos |
| D10 | Cron con pg_cron (Supabase) | Hora exacta Madrid, cambio de hora incluido, gratis | Vercel Cron (UTC, ±59 min en Hobby) |
| D11 | Categorías libres | Cada usuario las organiza a su manera | Lista fija por defecto |
| D12 | PWA móvil primero | Apuntar gastos en el momento | Escritorio |
| D13 | Multiusuario con RLS | Abierta a registro, datos aislados | Usuario único |
| D14 | Responsive: móvil primero + PC (≥ 900px menú lateral) | Revisar datos y gráficos cómodamente en el PC con la misma app | Solo móvil · App de escritorio aparte |
| D15 | **No rotar la secret key de Supabase** aunque salió en capturas (27/11/2026). Vercel sigue usando la clave `default`; la clave `vercel` creada ese día no se usa (se puede borrar) | App de uso personal; se asume el riesgo | Rotar: crear clave nueva → `SUPABASE_SERVICE_ROLE_KEY` en Vercel → Redeploy → probar Refrescar → borrar la vieja |

> **Revisar D15** si la app pasa a tener más usuarios o datos sensibles: aplicar la alternativa (pasos en la columna) y actualizar `SECRETOS.md`.
