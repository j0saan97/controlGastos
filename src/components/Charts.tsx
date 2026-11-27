import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { eur, type MonthTotal, type NetWorthPoint } from '../lib/api'
import { isHidden } from '../lib/privacy'

// Colores de serie validados (CVD y contraste) sobre la tarjeta #1a1d24.
// Azul/naranja en vez de verde/rojo: verde/rojo no se distinguen con daltonismo.
const C = {
  income: '#3987e5',
  expense: '#d95926',
  line: '#3987e5',
  grid: '#2a2e37',
  axis: '#8b8f98',
  text: '#e8e8ea',
  surface: '#1a1d24',
}

const shortMonth = (iso: string) => {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
}
const longMonth = (iso: string) => {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}
/** 41.091 → "41k" para el eje */
const compact = (n: number) =>
  isHidden() ? '•••' : Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n))

const tooltipProps = {
  contentStyle: { background: C.surface, border: `1px solid ${C.grid}`, borderRadius: 10, color: C.text },
  labelStyle: { color: C.text, fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: C.text, padding: 0 },
  formatter: (v: number) => eur(v),
  labelFormatter: (l: string) => longMonth(l),
}
const axisProps = { stroke: C.axis, tick: { fill: C.axis, fontSize: 12 }, tickLine: false, axisLine: false }

// ---------- F9-04 evolución del patrimonio ----------

export function NetWorthChart({ data }: { data: NetWorthPoint[] }) {
  // quitar los meses anteriores a la primera foto (salen a 0)
  const first = data.findIndex((p) => p.total !== 0)
  const points = first === -1 ? [] : data.slice(first)
  if (points.length < 2) {
    return <p className="msg">Se irá dibujando mes a mes: la app guarda una foto diaria de tus saldos.
      {points.length === 1 && <> Este mes: <strong>{eur(points[0].total)}</strong>.</>}</p>
  }
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={shortMonth} padding={{ left: 16, right: 16 }} {...axisProps} />
          <YAxis tickFormatter={compact} width={44} domain={['auto', 'auto']} {...axisProps} />
          <Tooltip {...tooltipProps} cursor={{ stroke: C.axis, strokeWidth: 1 }} />
          <Line type="monotone" dataKey="total" name="Patrimonio" stroke={C.line} strokeWidth={2} isAnimationActive={false}
            dot={{ r: 4, fill: C.line, stroke: C.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: C.line, stroke: C.surface, strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------- F9-05 ingresos vs gastos por mes ----------

export function IncomeExpenseChart({ data }: { data: MonthTotal[] }) {
  if (data.every((m) => m.income === 0 && m.expense === 0)) return <p className="msg">Aún no hay movimientos.</p>
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barGap={2} barCategoryGap="25%">
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={shortMonth} {...axisProps} />
          <YAxis tickFormatter={compact} width={44} {...axisProps} />
          <Tooltip {...tooltipProps} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }}
            formatter={(v) => <span style={{ color: C.text }}>{v}</span>} />
          <Bar dataKey="income" name="Ingresos" fill={C.income} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="expense" name="Gastos" fill={C.expense} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
