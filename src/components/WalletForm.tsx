import { useState, type FormEvent } from 'react'
import { createWallet, deleteWallet, syncSheet, updateWallet, type WalletInput } from '../lib/api'
import type { Wallet } from '../types/db'

export const WALLET_TYPES: Record<Wallet['type'], string> = {
  bank: 'Banco',
  ewallet: 'Billetera',
  poker: 'Poker',
  cash: 'Efectivo',
}

const CELL = /^[A-Z]{1,3}[0-9]{1,5}$/

/** "1.234,56" · "1234,56" · "1234.56" → 1234.56 */
export function parseAmount(s: string): number {
  const t = s.trim().replace(/\s|€/g, '')
  const normalized = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  return normalized === '' ? NaN : Number(normalized)
}

type Props = {
  wallet?: Wallet
  /** Carteras raíz disponibles como grupo padre (sin parent_id propio) */
  parentOptions?: Wallet[]
  /** Esta cartera ya tiene hijos → su saldo es calculado automáticamente */
  isParent?: boolean
  /** Grupo preseleccionado al crear desde "+ Añadir" dentro de un grupo */
  defaultParentId?: string
  onDone: () => void
}

export default function WalletForm({ wallet, parentOptions = [], isParent = false, defaultParentId, onDone }: Props) {
  const editing = !!wallet
  const [name, setName] = useState(wallet?.name ?? '')
  const [type, setType] = useState<Wallet['type']>(wallet?.type ?? 'bank')
  const [fromSheet, setFromSheet] = useState(wallet?.source === 'sheet')
  const [balance, setBalance] = useState(wallet ? String(wallet.balance).replace('.', ',') : '')
  const [url, setUrl] = useState(wallet?.sheet_csv_url ?? '')
  const [balanceCell, setBalanceCell] = useState(wallet?.sheet_balance_cell ?? 'A1')
  const [pnlCell, setPnlCell] = useState(wallet?.sheet_pnl_cell ?? 'B1')
  const [parentId, setParentId] = useState<string>(wallet?.parent_id ?? defaultParentId ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Un grupo nunca lee del Sheet: su saldo es la suma de sus salas
  const sheet = !isParent && type === 'poker' && fromSheet
  const autoBalance = isParent

  async function run(action: () => Promise<unknown>) {
    setBusy(true); setErr('')
    try { await action(); onDone() } catch (e) { setErr((e as Error).message) }
    setBusy(false)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const amount = autoBalance ? (wallet?.balance ?? 0) : (sheet ? (wallet?.balance ?? 0) : parseAmount(balance))
    if (!name.trim()) return setErr('Pon un nombre')
    if (!autoBalance && !sheet && !Number.isFinite(amount)) return setErr('Saldo no válido. Ejemplo: 1.234,56')
    if (sheet && !/^https:\/\//.test(url.trim())) return setErr('Pega el enlace de la hoja de Google (https://…)')
    if (sheet && (!CELL.test(balanceCell.toUpperCase()) || !CELL.test(pnlCell.toUpperCase())))
      return setErr('Celdas no válidas. Ejemplo: A1')

    const input: WalletInput = {
      name: name.trim(),
      type,
      balance: Math.round(amount * 100) / 100,
      source: sheet ? 'sheet' : 'manual',
      parent_id: parentId || null,
      sheet_csv_url: sheet ? url.trim() : null,
      sheet_balance_cell: balanceCell.toUpperCase(),
      sheet_pnl_cell: pnlCell.toUpperCase(),
    }

    run(async () => {
      if (editing) await updateWallet(wallet.id, input)
      else await createWallet(input)
      if (sheet) await syncSheet().catch(() => {})
    })
  }

  function remove() {
    if (!wallet || !confirm(`¿Eliminar "${wallet.name}"? No se puede deshacer.`)) return
    run(() => deleteWallet(wallet.id))
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Banco principal" autoFocus={!editing} />
      </label>

      <label>
        Tipo
        <select value={type} onChange={(e) => setType(e.target.value as Wallet['type'])}>
          {Object.entries(WALLET_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>

      {/* Selector de grupo padre (solo si hay grupos disponibles y no es ya un grupo padre) */}
      {!isParent && parentOptions.length > 0 && (
        <label>
          Pertenece al grupo
          <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— Cartera independiente —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      )}

      {type === 'poker' && !isParent && (
        <label className="check">
          <input type="checkbox" checked={fromSheet} onChange={(e) => setFromSheet(e.target.checked)} />
          Leer saldo del Google Sheet
        </label>
      )}

      {sheet ? (
        <>
          <label>
            Enlace de la hoja (abre la pestaña y copia la URL)
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…/edit?gid=…" />
          </label>
          <div className="grid">
            <label>Celda saldo<input value={balanceCell} onChange={(e) => setBalanceCell(e.target.value)} /></label>
            <label>Celda P/L día<input value={pnlCell} onChange={(e) => setPnlCell(e.target.value)} /></label>
          </div>
          <p className="msg">El saldo se actualiza solo desde el Sheet (al abrir la app y a las 03:00).</p>
        </>
      ) : isParent ? (
        <p className="msg">Saldo calculado automáticamente como suma de las salas/billeteras del grupo.</p>
      ) : (
        <label>
          {editing ? 'Saldo actual (€)' : 'Saldo inicial (€)'}
          <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" placeholder="0,00" />
        </label>
      )}

      {err && <p className="msg neg">{err}</p>}

      <button type="submit" disabled={busy}>{busy ? '…' : editing ? 'Guardar' : 'Crear cartera'}</button>

      {editing && (
        <div className="row actions">
          <button type="button" className="secondary" disabled={busy}
            onClick={() => run(() => updateWallet(wallet.id, { archived: !wallet.archived }))}>
            {wallet.archived ? 'Desarchivar' : 'Archivar'}
          </button>
          <button type="button" className="danger" disabled={busy} onClick={remove}>Eliminar</button>
        </div>
      )}
    </form>
  )
}
