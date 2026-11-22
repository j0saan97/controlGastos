# 04 · Guía de uso

> Algunas pantallas están en construcción (ver [fases](03-fases.md)).

## 1. Primer arranque
1. Abre la app en el móvil → **Regístrate** con email y contraseña.
2. Confirma el email.
3. Menú del navegador → **Añadir a pantalla de inicio** (se instala como app).

## 2. Configurar carteras (pestaña Carteras)
Crea una por cada sitio donde tienes dinero, con su saldo actual:

| Ejemplo | Tipo | Origen |
|---------|------|--------|
| Banco principal | Banco | Manual |
| Skrill | Billetera | Manual |
| Wise | Billetera | Manual |
| Poker | Poker | **Google Sheet** |
| Efectivo casa | Efectivo | Manual |

**Cartera Poker**: pega el enlace CSV publicado de tu Excel (ver
[despliegue §3](05-despliegue.md#3-google-sheet)). Se actualiza sola.

**Mover dinero** entre carteras (ej. banco → Skrill): edita el saldo de las dos.
No cuenta como gasto ni ingreso.

## 3. Categorías
Créalas a tu gusto, separadas en ingresos y gastos.
Ej. gastos: Hipoteca, Perro, Suscripciones, Recibos, Coche, Comida.

## 4. Fijos (pestaña Fijos)
Plantillas que se repiten cada mes: hipoteca, suscripciones, recibos, nómina…
- Importe **por defecto** y **día** del mes.
- Al empezar el mes → **Generar fijos del mes**: aparecen como pendientes.
- Si un mes el recibo es distinto, edita el importe solo en ese mes.

## 5. Día a día (pestaña Mes)
**Apuntar un gasto**: `+` → nombre, importe, categoría → queda **pendiente**
(sale en obligaciones del mes).

**Pagarlo**: toca el movimiento → **Marcar pagado** → elige la cartera
→ se descuenta de esa cartera.

**Ingresos**: igual, al marcar **cobrado** se suma en la cartera elegida.

**Corregir**: si editas el importe o lo borras, el saldo se ajusta solo.
Si lo desmarcas, el dinero vuelve a la cartera.

## 6. Inicio (dashboard)
| Dato | Qué es |
|------|--------|
| **Disponible real** | Total carteras − gastos pendientes + ingresos pendientes |
| Total carteras | Suma de todos los saldos |
| Obligaciones pendientes | Gastos del mes aún sin pagar |
| Ingresos pendientes | Ingresos del mes aún sin cobrar |
| Poker hoy | P/L del día leído del Excel |

**Refrescar**: vuelve a leer el Excel ahora. Al abrir la app también se lee.
Cada noche a las **03:00** se lee automáticamente.

## 7. Preguntas frecuentes
**¿Tengo que subir capturas?** No. Solo actualiza tu Excel como siempre.

**¿Dólares?** No. Todo es €; ACR lo conviertes en el Excel.

**¿Mi pareja puede usarla?** Sí, con su propia cuenta. Cada uno ve solo lo suyo.

**El saldo de poker no cambia**: Google tarda ~5 min en publicar cambios.
Pulsa Refrescar después.
