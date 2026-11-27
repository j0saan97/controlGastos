import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { CategoryBars } from '../components/CategoryBars'
import { Link } from 'react-router-dom'
import {
  eur, firstOfMonth, generateMonth, getCategoryTotals, getDashboard, getMonthTotals, getNetWorthHistory,
  listUpcoming, listWallets, syncSheet, type CategoryTotal, type MonthTotal, type NetWorthPoint,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import { useHidden } from '../lib/privacy'
import type { Dashboard as D, Transaction } from '../types/db'
// Recharts pesa ~400 kB: se descarga aparte para no retrasar las tarjetas
const IncomeExpenseChart = lazy(() => import('../components/Charts').then((m) => ({ default: m.IncomeExpenseChart })))
const NetWorthChart = lazy(() => import('../components/Charts').then((m) => ({ default: m.NetWorthChart })))

type ChartsData = { cats: CategoryTotal[]; months: MonthTotal[]; worth: NetWorthPoint[]; upcoming: Transaction[] }

const pad = (n: number) => String(n).padStart(2, '0')
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const dueLabel = (iso: string | null, today: string) => {
  if (!iso) return ''
  if (iso < today) return 'Vencido'
  if (iso === today) return 'Hoy'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const hidden = useHidden() // F10-08
  const [d, setD] = useState<D | null>(null)
  const [charts, setCharts] = useState<ChartsData | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const [hasWallets, setHasWallets] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    try {
      const [dash, wallets] = await Promise.all([getDashboard(), listWallets()])
      setD(dash)
      setHasWallets(wallets.some((w) => !w.archived))
    } catch (e) { setErr((e as Error).message) }
    // los gráficos no bloquean las tarjetas
    try {
      const [cats, months, worth, upcoming] = await Promise.all([
        getCategoryTotals(firstOfMonth()), getMonthTotals(6), getNetWorthHistory(12), listUpcoming(7),
      ])
      setCharts({ cats, months, worth, upcoming })
    } catch (e) { setErr((e as Error).message) }
  }, [])

  // al abrir: lee el Sheet + genera los fijos del mes (F7-05, no duplica) y carga
  useEffect(() => {
    Promise.allSettled([syncSheet(), generateMonth()]).finally(load)
  }, [load])

  async function refresh() {
    setBusy(true); setErr('')
    try { await syncSheet(); await load() } catch (e) { setErr((e as Error).message) }
    setBusy(false)
  }

  if (!d) return <p>{err || 'Cargando…'}</p>

  // F4-06: sin carteras → bienvenida
  if (hasWallets === false) {
    return (
      <section className="welcome">
        <h2>¡Bienvenido!</h2>
        <p>Para empezar, crea tus carteras: una por cada sitio donde tengas dinero
          (banco, Skrill, Wise, poker, efectivo…) con su saldo actual.</p>
        <Link className="button" to="/carteras?nueva=1">Crear mi primera cartera</Link>
        <button className="link" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </section>
    )
  }

  return (
    <section>
      <header className="row">
        <h2>Resumen</h2>
        <button onClick={refresh} disabled={busy}>{busy ? '…' : 'Refrescar'}</button>
      </header>

      <div className="card big">
        <span>Disponible real</span>
        <strong>{eur(d.available)}</strong>
      </div>

      <div className="grid">
        <div className="card"><span>Total carteras</span><strong>{eur(d.total_balance)}</strong></div>
        <div className="card"><span>Obligaciones pendientes</span><strong className="neg">{eur(d.pending_expenses)}</strong></div>
        <div className="card"><span>Ingresos pendientes</span><strong className="pos">{eur(d.pending_income)}</strong></div>
        <div className="card">
          <span>Poker hoy</span>
          <strong className={(d.poker_pnl ?? 0) >= 0 ? 'pos' : 'neg'}>{eur(d.poker_pnl)}</strong>
        </div>
      </div>

      {charts && (
        <>
          {/* F9-06 próximas obligaciones */}
          <section className="panel">
            <header className="row">
              <h3>Próximos 7 días</h3>
              <Link className="link" to="/movimientos">Ver todo</Link>
            </header>
            {charts.upcoming.length === 0 ? (
              <p className="msg">Nada pendiente de pagar esta semana.</p>
            ) : (
              <ul className="upcoming">
                {charts.upcoming.map((t) => {
                  const label = dueLabel(t.due_date, todayIso())
                  return (
                    <li key={t.id} className="row">
                      <span>
                        <span className={`due${label === 'Vencido' ? ' late' : ''}`}>{label}</span>
                        {t.name}
                      </span>
                      <strong>{eur(t.amount)}</strong>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <div className="panels">
            {/* F9-03 */}
            <section className="panel">
              <h3>Gasto por categoría · {new Date().toLocaleDateString('es-ES', { month: 'long' })}</h3>
              <CategoryBars rows={charts.cats} />
            </section>

            {/* F9-05 */}
            <section className="panel">
              <h3>Ingresos vs gastos · 6 meses</h3>
              <Suspense fallback={<div className="chart-loading" />}>
                <IncomeExpenseChart key={String(hidden)} data={charts.months} />
              </Suspense>
            </section>
          </div>

          {/* F9-04 */}
          <section className="panel">
            <h3>Patrimonio · 12 meses</h3>
            <Suspense fallback={<div className="chart-loading" />}>
              <NetWorthChart key={String(hidden)} data={charts.worth} />
            </Suspense>
          </section>
        </>
      )}

      {err && <p className="msg">{err}</p>}
      <button className="link" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
    </section>
  )
}
