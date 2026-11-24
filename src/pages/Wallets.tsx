import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eur, listWallets } from '../lib/api'
import type { Wallet } from '../types/db'
import Modal from '../components/Modal'
import WalletForm, { WALLET_TYPES } from '../components/WalletForm'

const when = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[] | null>(null)
  const [err, setErr] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [params, setParams] = useSearchParams()
  // ?nueva=1 abre el formulario (desde la bienvenida)
  const [editing, setEditing] = useState<Wallet | 'new' | null>(params.has('nueva') ? 'new' : null)

  const load = useCallback(async () => {
    try { setWallets(await listWallets()) } catch (e) { setErr((e as Error).message) }
  }, [])

  useEffect(() => { load() }, [load])

  const close = useCallback(() => {
    setEditing(null)
    if (params.has('nueva')) setParams({}, { replace: true })
  }, [params, setParams])

  function done() { close(); load() }

  if (!wallets) return <p>{err || 'Cargando…'}</p>

  const active = wallets.filter((w) => !w.archived)
  const archived = wallets.filter((w) => w.archived)
  const total = active.reduce((s, w) => s + Number(w.balance), 0)

  const item = (w: Wallet) => (
    <li key={w.id}>
      <button className="list-item" onClick={() => setEditing(w)}>
        <div>
          <strong>{w.name}</strong>
          <span>
            {WALLET_TYPES[w.type]}
            {w.source === 'sheet' && (w.last_synced_at ? ` · Sync ${when(w.last_synced_at)}` : ' · Sin sincronizar')}
          </span>
        </div>
        <div className="amount">
          <strong>{eur(w.balance)}</strong>
          {w.source === 'sheet' && w.last_pnl !== null && (
            <span className={w.last_pnl >= 0 ? 'pos' : 'neg'}>{w.last_pnl >= 0 ? '+' : ''}{eur(w.last_pnl)} hoy</span>
          )}
        </div>
      </button>
    </li>
  )

  return (
    <section>
      <header className="row">
        <h2>Carteras</h2>
        <button onClick={() => setEditing('new')}>+ Nueva</button>
      </header>

      <div className="card big">
        <span>Total</span>
        <strong>{eur(total)}</strong>
      </div>

      {active.length === 0 ? (
        <p className="msg">Aún no tienes carteras. Crea una por cada sitio donde tengas dinero.</p>
      ) : (
        <ul className="list">{active.map(item)}</ul>
      )}

      <p className="msg">Para mover dinero entre carteras, edita el saldo de las dos.</p>

      {archived.length > 0 && (
        <>
          <button className="link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? '▾' : '▸'} Archivadas ({archived.length})
          </button>
          {showArchived && <ul className="list muted">{archived.map(item)}</ul>}
        </>
      )}

      {err && <p className="msg neg">{err}</p>}

      {editing && (
        <Modal title={editing === 'new' ? 'Nueva cartera' : editing.name} onClose={close}>
          <WalletForm wallet={editing === 'new' ? undefined : editing} onDone={done} />
        </Modal>
      )}
    </section>
  )
}
