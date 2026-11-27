import { eur, type CategoryTotal } from '../lib/api'

/** F9-03 gasto por categoría: barras horizontales en HTML (sin Recharts, carga al instante) */
export function CategoryBars({ rows }: { rows: CategoryTotal[] }) {
  if (rows.length === 0) return <p className="msg">Sin gastos este mes.</p>
  const max = Math.max(...rows.map((r) => r.total))
  const total = rows.reduce((s, r) => s + r.total, 0)
  return (
    <ul className="cat-bars">
      {rows.map((r) => (
        <li key={r.category} title={`${r.category}: ${eur(r.total)} (pagado ${eur(r.paid)})`}>
          <div className="row">
            <span>{r.category}</span>
            <span><strong>{eur(r.total)}</strong> · {Math.round((r.total / total) * 100)}%</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${(r.total / max) * 100}%`, background: r.color ?? '#6b7280' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
