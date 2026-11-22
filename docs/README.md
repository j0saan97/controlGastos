# Documentación — Mis Gastos

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Tecnología](01-tecnologia.md) | Stack, librerías, versiones, servicios |
| 02 | [Arquitectura](02-arquitectura.md) | Modelo de datos, flujos, seguridad |
| 03 | [Fases y tareas](03-fases.md) | Roadmap con código de tarea y checkbox |
| 04 | [Guía de uso](04-guia-uso.md) | Cómo usar la app día a día |
| 05 | [Despliegue](05-despliegue.md) | Supabase, Vercel, Google Sheet, cron |
| 06 | [Decisiones](06-decisiones.md) | Por qué se eligió cada cosa |
| 07 | [API](07-api.md) | Endpoints Vercel y RPC de Supabase |

## Resumen del proyecto
App web (PWA, pensada para móvil) para controlar gastos e ingresos mensuales,
fijos y variables, por categorías, y el saldo de todas las carteras
(banco, Skrill, Wise, poker, efectivo). Todo en **€**. Multiusuario: cada usuario
ve solo sus datos.

## Convenciones
- Código de tarea: `F<fase>-<nº>` → ej. `F8-03`.
- Commits: `F8-03: marcar pagado con selector de cartera`.
- Importes: siempre positivos; el tipo (`income`/`expense`) da el signo.
- Meses: se guardan como fecha día 1 (`2026-12-01`).
