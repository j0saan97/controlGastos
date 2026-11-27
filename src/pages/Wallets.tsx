import { useCallback, useEffect, useState } from 'react'
import { Empty, LoadState } from '../components/States'
import { errorText } from '../lib/errors'
import { useSearchParams } from 'react-router-dom'
import { eur, listWallets } from '../lib/api'
import type { Wallet } from '../types/db'
import Modal from '../components/Modal'
import { toast } from '../lib/toast'
import { useHidden } from '../lib/privacy'
import WalletForm, { WALLET_TYPES } from '../components/WalletForm'

const when = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

export default function Wallets() {
  useHidden() // F10-08: repintar al pulsar 👁
  const [wallets, setWallets] = useState<Wallet[] | null>(null)
  const [err, setErr] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Wallet | 'new' | null>(params.has('nueva') ? 'new' : null)
  const [newParentId, setNewParentId] = useState<string | undefined>()

  const load = useCallback(async () => {
    try { setWallets(await listWallets()) } catch (e) { setErr(errorText(e)) }
  }, [])

  useEffect(() => { load() }, [load])

  const close = useCallback(() => {
    setEditing(null)
    setNewParentId(undefined)
    if (params.has('nueva')) setParams({}, { replace: true })
  }, [params, setParams])

  function done() { close(); load(); toast('Cambios guardados') }

  if (!wallets) return <LoadState err={err} onRetry={() => { setErr(''); load() }} />

  const active = wallets.filter((w) => !w.archived)
  const archived = wallets.filter((w) => w.archived)

  // Separar raíces e hijos
  const roots = active.filter((w) => !w.parent_id)
  const childrenOf = (id: string) => active.filter((w) => w.parent_id === id)
  const isGroup = (w: Wallet) => active.some((c) => c.parent_id === w.id)

  // Total solo desde carteras raíz (hijos ya están sumados en el padre)
  const total = roots.reduce((s, w) => s + Number(w.balance), 0)

  // Carteras disponibles como grupo padre al crear/editar
  const parentOptions = roots.filter((w) => w.id !== (editing !== 'new' ? editing?.id : undefined))

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const item = (w: Wallet) => {
    const group = isGroup(w)
    const open = expanded.has(w.id)
    const children = group ? childrenOf(w.id) : []

    return (
      <li key={w.id}>
        <button className="list-item" onClick={() => group ? toggleExpand(w.id) : setEditing(w)}>
          <div>
            <strong>
              {group && <span style={{ marginRight: 4 }}>{open ? '▾' : '▸'}</span>}
              {w.name}
            </strong>
            <span>
              {WALLET_TYPES[w.type]}
              {group && ` · ${children.length} subcarteras`}
              {!group && w.source === 'sheet' && (w.last_synced_at ? ` · Sync ${when(w.last_synced_at)}` : ' · Sin sincronizar')}
            </span>
          </div>
          <div className="amount">
            <strong>{eur(w.balance)}</strong>
            {!group && w.source === 'sheet' && w.last_pnl !== null && (
              <span className={w.last_pnl >= 0 ? 'pos' : 'neg'}>{w.last_pnl >= 0 ? '+' : ''}{eur(w.last_pnl)} hoy</span>
            )}
          </div>
        </button>

        {/* Sub-carteras del grupo */}
        {group && open && (
          <ul className="list" style={{ marginLeft: '1.25rem', marginTop: 0 }}>
            {children.map((c) => (
              <li key={c.id}>
                <button className="list-item" onClick={() => setEditing(c)}>
                  <div>
                    <strong>{c.name}</strong>
                    <span>
                      {WALLET_TYPES[c.type]}
                      {c.source === 'sheet' && (c.last_synced_at ? ` · Sync ${when(c.last_synced_at)}` : ' · Sin sincronizar')}
                    </span>
                  </div>
                  <div className="amount">
                    <strong>{eur(c.balance)}</strong>
                    {c.last_pnl !== null && (
                      <span className={c.last_pnl >= 0 ? 'pos' : 'neg'}>{c.last_pnl >= 0 ? '+' : ''}{eur(c.last_pnl)} hoy</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
            <li className="row">
              <button className="link" style={{ padding: '0.4rem 0.75rem' }}
                onClick={() => { setNewParentId(w.id); setEditing('new') }}>
                + Añadir sala / billetera
              </button>
              <button className="link" style={{ padding: '0.4rem 0.75rem' }} onClick={() => setEditing(w)}>
                Editar grupo
              </button>
            </li>
          </ul>
        )}
      </li>
    )
  }

  const editingWallet = editing !== null && editing !== 'new' ? editing : undefined
  const editingIsParent = editingWallet ? isGroup(editingWallet) : false

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

      {roots.length === 0 ? (
        <Empty icon="👛" title="Aún no tienes carteras" action={<button onClick={() => setEditing('new')}>+ Crear cartera</button>}>
          Crea una por cada sitio donde tengas dinero.
        </Empty>
      ) : (
        <ul className="list">{roots.map(item)}</ul>
      )}

      <p className="msg">Para mover dinero entre carteras, edita el saldo de las dos.</p>

      {archived.length > 0 && (
        <>
          <button className="link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? '▾' : '▸'} Archivadas ({archived.length})
          </button>
          {showArchived && (
            <ul className="list muted">
              {archived.map((w) => (
                <li key={w.id}>
                  <button className="list-item" onClick={() => setEditing(w)}>
                    <div>
                      <strong>{w.name}</strong>
                      <span>{WALLET_TYPES[w.type]}</span>
                    </div>
                    <div className="amount"><strong>{eur(w.balance)}</strong></div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {err && <p className="msg neg">{err}</p>}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Nueva cartera' : editing.name}
          onClose={close}
        >
          <WalletForm
            wallet={editingWallet}
            parentOptions={parentOptions}
            isParent={editingIsParent}
            defaultParentId={newParentId}
            onDone={done}
          />
        </Modal>
      )}
    </section>
  )
}
