import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createTransaction, deleteTransaction, eur, firstOfMonth, generateMonth, listCategories, listTransactions,
  listWallets, markPending, payTransaction, updateTransaction, type TxInput,
} from '../lib/api'
import type { Category, Kind, Transaction, Wallet } from '../types/db'
import Modal from '../components/Modal'
import { useHidden } from '../lib/privacy'
import { parseAmount } from '../components/WalletForm'

// ---------- utilidades de fecha (month = 'AAAA-MM-01') ----------

const pad = (n: number) => String(n).padStart(2, '0')
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const shiftMonth = (m: string, delta: number) => {
  const [y, mo] = m.split('-').map(Number)
  return firstOfMonth(new Date(y, mo - 1 + delta, 1))
}
const monthLabel = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}
const dayOf = (iso: string | null) => (iso ? Number(iso.slice(8, 10)) : null)

const LAST_WALLET = 'lastWalletId'
const fmtAmount = (n: number) => String(n).replace('.', ',')

type Filters = { kind: 'all' | Kind; cat: string; fixed: 'all' | 'fixed' | 'variable'; status: 'all' | 'pending' | 'paid' }
const NO_FILTERS: Filters = { kind: 'all', cat: 'all', fixed: 'all', status: 'all' }

export default function Movements() {
  useHidden() // F10-08: repintar al pulsar 👁
  const [month, setMonth] = useState(firstOfMonth())
  const [txs, setTxs] = useState<Transaction[] | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [err, setErr] = useState('')
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null)
  const [paying, setPaying] = useState<Transaction | null>(null)

  const load = useCallback(async (m: string) => {
    setErr('')
    try {
      // F7-05: al abrir el mes actual o uno futuro se crean sus fijos (no duplica)
      if (m >= firstOfMonth()) await generateMonth(m).catch(() => {})
      const [t, c, w] = await Promise.all([listTransactions(m), listCategories(), listWallets()])
      setTxs(t); setCats(c); setWallets(w)
    } catch (e) { setErr((e as Error).message) }
  }, [])

  useEffect(() => { setTxs(null); load(month) }, [month, load])

  const close = useCallback(() => { setEditing(null); setPaying(null) }, [])
  const done = () => { close(); load(month) }

  async function undo(t: Transaction) {
    try { await markPending(t.id); load(month) } catch (e) { setErr((e as Error).message) }
  }

  const catById = new Map(cats.map((c) => [c.id, c]))
  const walletById = new Map(wallets.map((w) => [w.id, w]))
  // Solo carteras "hoja" y manuales: un grupo se recalcula solo y una del Sheet se sobrescribe al sincronizar
  const payable = wallets.filter((w) => !w.archived && w.source === 'manual' && !wallets.some((c) => c.parent_id === w.id))

  const all = txs ?? []
  const sum = (k: Kind, st?: Transaction['status']) =>
    all.filter((t) => t.kind === k && (!st || t.status === st)).reduce((s, t) => s + t.amount, 0)
  const net = sum('income') - sum('expense')

  const visible = all.filter((t) =>
    (filters.kind === 'all' || t.kind === filters.kind) &&
    (filters.cat === 'all' || (filters.cat === 'none' ? !t.category_id : t.category_id === filters.cat)) &&
    (filters.fixed === 'all' || (filters.fixed === 'fixed') === t.is_fixed) &&
    (filters.status === 'all' || t.status === filters.status),
  )
  const pending = visible.filter((t) => t.status === 'pending')
    .sort((a, b) => (a.due_date ?? '9').localeCompare(b.due_date ?? '9') || a.name.localeCompare(b.name))
  const paid = visible.filter((t) => t.status === 'paid')
    .sort((a, b) => (b.paid_at ?? '').localeCompare(a.paid_at ?? ''))
  const activeFilters = (Object.keys(filters) as (keyof Filters)[]).filter((k) => filters[k] !== NO_FILTERS[k]).length

  const row = (t: Transaction) => {
    const cat = t.category_id ? catById.get(t.category_id) : undefined
    const day = dayOf(t.due_date)
    const isPaid = t.status === 'paid'
    const info = [
      day && `Día ${day}`,
      cat?.name ?? 'Sin categoría',
      t.is_fixed && 'Fijo',
      isPaid && t.wallet_id && `${t.kind === 'income' ? 'Cobrado en' : 'Pagado con'} ${walletById.get(t.wallet_id)?.name ?? '—'}`,
    ].filter(Boolean).join(' · ')

    return (
      <li key={t.id} className="tx-row">
        <button className="list-item" onClick={() => setEditing(t)}>
          <div>
            <strong className="with-dot">
              <i className="dot" style={{ background: cat?.color ?? '#555' }} />
              {t.name}
            </strong>
            <span>{info}</span>
          </div>
          <div className="amount">
            <strong className={t.kind === 'income' ? 'pos' : ''}>
              {t.kind === 'income' ? '+' : '−'}{eur(t.amount)}
            </strong>
          </div>
        </button>
        {isPaid ? (
          <button className="tick undo" onClick={() => undo(t)}
            aria-label={`Volver a pendiente: ${t.name}`} title="Volver a pendiente">↺</button>
        ) : (
          <button className="tick" onClick={() => setPaying(t)}
            aria-label={`${t.kind === 'income' ? 'Cobrar' : 'Pagar'}: ${t.name}`}
            title={t.kind === 'income' ? 'Cobrar' : 'Pagar'}>✓</button>
        )}
      </li>
    )
  }

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <section>
      <header className="row">
        <h2>Movimientos</h2>
        <button onClick={() => setEditing('new')}>+ Nuevo</button>
      </header>

      {/* F8-01 selector de mes */}
      <div className="month-nav">
        <button className="secondary" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Mes anterior">‹</button>
        <strong>{monthLabel(month)}</strong>
        <button className="secondary" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Mes siguiente">›</button>
      </div>
      {month !== firstOfMonth() && (
        <button className="link" onClick={() => setMonth(firstOfMonth())}>Volver al mes actual</button>
      )}

      {/* F8-09 totales del mes */}
      <div className="grid">
        <div className="card">
          <span>Gastos</span>
          <strong className="neg">{eur(sum('expense'))}</strong>
          <span>Falta pagar {eur(sum('expense', 'pending'))}</span>
        </div>
        <div className="card">
          <span>Ingresos</span>
          <strong className="pos">{eur(sum('income'))}</strong>
          <span>Falta cobrar {eur(sum('income', 'pending'))}</span>
        </div>
      </div>
      <p className="msg">Neto del mes: <strong className={net >= 0 ? 'pos' : 'neg'}>{eur(net)}</strong></p>

      {/* F8-08 filtros */}
      <button className="link" onClick={() => setShowFilters(!showFilters)}>
        {showFilters ? '▾' : '▸'} Filtros{activeFilters ? ` (${activeFilters})` : ''}
      </button>
      {showFilters && (
        <div className="filters">
          <select value={filters.kind} onChange={(e) => set('kind', e.target.value as Filters['kind'])} aria-label="Tipo">
            <option value="all">Gastos e ingresos</option>
            <option value="expense">Solo gastos</option>
            <option value="income">Solo ingresos</option>
          </select>
          <select value={filters.cat} onChange={(e) => set('cat', e.target.value)} aria-label="Categoría">
            <option value="all">Todas las categorías</option>
            <option value="none">Sin categoría</option>
            {cats.filter((c) => filters.kind === 'all' || c.kind === filters.kind)
              .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.fixed} onChange={(e) => set('fixed', e.target.value as Filters['fixed'])} aria-label="Fijo o variable">
            <option value="all">Fijos y variables</option>
            <option value="fixed">Solo fijos</option>
            <option value="variable">Solo variables</option>
          </select>
          <select value={filters.status} onChange={(e) => set('status', e.target.value as Filters['status'])} aria-label="Estado">
            <option value="all">Pendientes y pagados</option>
            <option value="pending">Solo pendientes</option>
            <option value="paid">Solo pagados</option>
          </select>
          {activeFilters > 0 && <button className="link" onClick={() => setFilters(NO_FILTERS)}>Quitar filtros</button>}
        </div>
      )}

      {/* F8-02 listado: pendientes arriba, pagados abajo */}
      {!txs ? (
        <p>{err || 'Cargando…'}</p>
      ) : all.length === 0 ? (
        <p className="msg">No hay movimientos en {monthLabel(month)}. Pulsa “+ Nuevo” para apuntar un gasto o ingreso.</p>
      ) : visible.length === 0 ? (
        <p className="msg">Ningún movimiento con esos filtros.</p>
      ) : (
        <>
          {pending.length > 0 && <h3 className="sub">Pendientes ({pending.length})</h3>}
          <ul className="list">{pending.map(row)}</ul>
          {paid.length > 0 && <h3 className="sub">Pagados ({paid.length})</h3>}
          <ul className="list paid">{paid.map(row)}</ul>
        </>
      )}

      {err && txs && <p className="msg neg">{err}</p>}

      {editing && (
        <Modal title={editing === 'new' ? 'Nuevo movimiento' : editing.name} onClose={close}>
          <TxForm tx={editing === 'new' ? undefined : editing} month={month} cats={cats}
            payable={payable} walletById={walletById} onDone={done} />
        </Modal>
      )}

      {paying && (
        <Modal title={`${paying.kind === 'income' ? 'Cobrar' : 'Pagar'} ${paying.name}`} onClose={close}>
          <PayForm tx={paying} payable={payable} onDone={done} />
        </Modal>
      )}
    </section>
  )
}

/** Última cartera usada para pagar (si sigue disponible) o la primera */
function initialWallet(payable: Wallet[]) {
  const remembered = localStorage.getItem(LAST_WALLET)
  return payable.find((w) => w.id === remembered)?.id ?? payable[0]?.id ?? ''
}

// ---------- F8-06 pagar: importe final + cartera ----------

function PayForm({ tx, payable, onDone }: { tx: Transaction; payable: Wallet[]; onDone: () => void }) {
  const [walletId, setWalletId] = useState(() => initialWallet(payable))
  const [amount, setAmount] = useState(fmtAmount(tx.amount))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const income = tx.kind === 'income'

  async function submit(e: FormEvent) {
    e.preventDefault()
    const a = parseAmount(amount)
    if (!Number.isFinite(a) || a <= 0) return setErr('Importe no válido. Ejemplo: 65,40')
    if (!walletId) return setErr('Elige una cartera')
    setBusy(true); setErr('')
    try {
      await payTransaction(tx.id, walletId, Math.round(a * 100) / 100)
      localStorage.setItem(LAST_WALLET, walletId)
      onDone()
    } catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  if (payable.length === 0) {
    return <p className="msg">No tienes carteras manuales. Crea una en Carteras (los grupos y las del Sheet no se usan para pagar).</p>
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Importe final (€)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
      </label>

      <fieldset className="wallet-pick">
        <legend>{income ? '¿Dónde lo cobras?' : '¿Con qué cartera pagas?'}</legend>
        {payable.map((w) => (
          <label key={w.id} className={walletId === w.id ? 'on' : ''}>
            <input type="radio" name="wallet" value={w.id} checked={walletId === w.id} onChange={() => setWalletId(w.id)} />
            <span>{w.name}</span>
            <span className="bal">{eur(w.balance)}</span>
          </label>
        ))}
      </fieldset>

      {err && <p className="msg neg">{err}</p>}
      <button type="submit" disabled={busy}>{busy ? '…' : income ? 'Marcar cobrado' : 'Marcar pagado'}</button>
    </form>
  )
}

// ---------- F8-03 / F8-04 / F8-05 crear, editar, eliminar ----------

type TxFormProps = {
  tx?: Transaction
  month: string
  cats: Category[]
  payable: Wallet[]
  walletById: Map<string, Wallet>
  onDone: () => void
}

function TxForm({ tx, month, cats, payable, walletById, onDone }: TxFormProps) {
  const today = todayIso()
  const nextMonth = shiftMonth(month, 1)
  const defaultDate = today >= month && today < nextMonth ? today : month
  const [kind, setKind] = useState<Kind>(tx?.kind ?? 'expense')
  const [name, setName] = useState(tx?.name ?? '')
  const [categoryId, setCategoryId] = useState(tx?.category_id ?? '')
  const [amount, setAmount] = useState(tx ? fmtAmount(tx.amount) : '')
  const [date, setDate] = useState(tx ? tx.due_date ?? '' : defaultDate)
  const [note, setNote] = useState(tx?.note ?? '')
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [walletId, setWalletId] = useState(() => initialWallet(payable))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const kindCats = cats.filter((c) => c.kind === kind)
  const isPaid = tx?.status === 'paid'

  async function run(action: () => Promise<unknown>) {
    setBusy(true); setErr('')
    try { await action(); onDone() } catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  function changeKind(k: Kind) {
    setKind(k)
    if (!cats.some((c) => c.id === categoryId && c.kind === k)) setCategoryId('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const a = parseAmount(amount)
    if (!name.trim()) return setErr('Pon un nombre')
    if (!Number.isFinite(a) || a <= 0) return setErr('Importe no válido. Ejemplo: 12,50')
    if (date && (date < month || date >= nextMonth)) return setErr(`La fecha tiene que ser de ${monthLabel(month)}`)
    if (!tx && alreadyPaid && !walletId) return setErr('Elige una cartera')

    const input: TxInput = {
      month,
      name: name.trim(),
      kind,
      category_id: categoryId || null,
      amount: Math.round(a * 100) / 100,
      due_date: date || null,
      note: note.trim() || null,
    }
    run(async () => {
      if (tx) await updateTransaction(tx.id, input)
      else {
        await createTransaction(input, alreadyPaid ? walletId : undefined)
        if (alreadyPaid) localStorage.setItem(LAST_WALLET, walletId)
      }
    })
  }

  function remove() {
    if (!tx) return
    const extra = isPaid ? ' El dinero vuelve a la cartera.' : ''
    if (!confirm(`¿Eliminar "${tx.name}"?${extra}`)) return
    run(() => deleteTransaction(tx.id))
  }

  return (
    <form className="form" onSubmit={submit}>
      {/* un fijo o uno ya pagado no cambia de tipo (descuadraría la plantilla o el saldo) */}
      {!tx?.is_fixed && !isPaid && (
        <div className="segmented" role="radiogroup" aria-label="Tipo">
          {(['expense', 'income'] as Kind[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k}
              className={kind === k ? 'on' : ''} onClick={() => changeKind(k)}>
              {k === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
      )}

      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder={kind === 'expense' ? 'Supermercado' : 'Bizum de…'} autoFocus={!tx} />
      </label>

      <div className="grid">
        <label>
          Importe (€)
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" />
        </label>
        <label>
          Fecha
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <label>
        Categoría
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Sin categoría</option>
          {kindCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <label>
        Nota (opcional)
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {!tx && payable.length > 0 && (
        <>
          <label className="check">
            <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} />
            {kind === 'income' ? 'Ya cobrado' : 'Ya pagado'}
          </label>
          {alreadyPaid && (
            <label>
              Cartera
              <select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                {payable.map((w) => <option key={w.id} value={w.id}>{w.name} · {eur(w.balance)}</option>)}
              </select>
            </label>
          )}
        </>
      )}

      {isPaid && tx?.wallet_id && (
        <p className="msg">
          {kind === 'income' ? 'Cobrado en' : 'Pagado con'} {walletById.get(tx.wallet_id)?.name ?? '—'}.
          Si cambias el importe, el saldo de esa cartera se ajusta solo.
        </p>
      )}

      {err && <p className="msg neg">{err}</p>}

      <button type="submit" disabled={busy}>{busy ? '…' : tx ? 'Guardar' : 'Crear movimiento'}</button>

      {tx && (tx.is_fixed ? (
        <p className="msg">Es un fijo: si lo borras se vuelve a crear al abrir el mes. Para quitarlo, desactívalo en Fijos.</p>
      ) : (
        <button type="button" className="danger" disabled={busy} onClick={remove}>Eliminar</button>
      ))}
    </form>
  )
}
