import { useCallback, useEffect, useState } from 'react'
import { eur, getDashboard, syncSheet } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Dashboard as D } from '../types/db'

export default function Dashboard() {
  const [d, setD] = useState<D | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try { setD(await getDashboard()) } catch (e) { setErr((e as Error).message) }
  }, [])

  // al abrir: lee el Sheet y luego carga el dashboard
  useEffect(() => {
    syncSheet().catch(() => {}).finally(load)
  }, [load])

  async function refresh() {
    setBusy(true); setErr('')
    try { await syncSheet(); await load() } catch (e) { setErr((e as Error).message) }
    setBusy(false)
  }

  if (!d) return <p>{err || 'Cargando…'}</p>

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

      {err && <p className="msg">{err}</p>}
      <button className="link" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
    </section>
  )
}
