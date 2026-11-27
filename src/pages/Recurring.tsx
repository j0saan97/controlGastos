import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Empty, LoadState } from '../components/States'
import { errorText } from '../lib/errors'
import {
  createRecurring, deleteRecurring, eur, generateMonth, listCategories, listRecurring, updateRecurring,
  type RecurringInput,
} from '../lib/api'
import type { Category, Kind, RecurringItem } from '../types/db'
import Modal from '../components/Modal'
import { toast } from '../lib/toast'
import { useHidden } from '../lib/privacy'
import { parseAmount } from '../components/WalletForm'

const monthName = new Date().toLocaleDateString('es-ES', { month: 'long' })

export default function Recurring() {
  useHidden() // F10-08: repintar al pulsar 👁
  const [items, setItems] = useState<RecurringItem[] | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<RecurringItem | 'new' | null>(null)

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([listRecurring(), listCategories()])
      setItems(r); setCats(c)
    } catch (e) { setErr(errorText(e)) }
  }, [])

  useEffect(() => { load() }, [load])

  const close = useCallback(() => setEditing(null), [])

  async function generate() {
    setBusy(true); setErr(''); setInfo('')
    try {
      const n = await generateMonth()
      setInfo(n === 0 ? `Los fijos de ${monthName} ya estaban generados.` : `Añadidos ${n} fijos a ${monthName}.`)
    } catch (e) { setErr(errorText(e)) }
    setBusy(false)
  }

  if (!items) return <LoadState err={err} onRetry={() => { setErr(''); load() }} />

  const catById = new Map(cats.map((c) => [c.id, c]))
  const active = items.filter((i) => i.active)
  const inactive = items.filter((i) => !i.active)
  const sum = (k: Kind) => active.filter((i) => i.kind === k).reduce((s, i) => s + Number(i.default_amount), 0)

  const row = (i: RecurringItem) => {
    const cat = i.category_id ? catById.get(i.category_id) : undefined
    return (
      <li key={i.id}>
        <button className="list-item" onClick={() => setEditing(i)}>
          <div>
            <strong className="with-dot">
              <i className="dot" style={{ background: cat?.color ?? '#555' }} />
              {i.name}
            </strong>
            <span>Día {i.day_of_month} · {cat?.name ?? 'Sin categoría'}</span>
          </div>
          <div className="amount">
            <strong className={i.kind === 'income' ? 'pos' : ''}>
              {i.kind === 'income' ? '+' : '−'}{eur(i.default_amount)}
            </strong>
          </div>
        </button>
      </li>
    )
  }

  return (
    <section>
      <header className="row">
        <h2>Fijos</h2>
        <button onClick={() => setEditing('new')}>+ Nuevo</button>
      </header>

      <div className="grid">
        <div className="card"><span>Gastos fijos / mes</span><strong className="neg">{eur(sum('expense'))}</strong></div>
        <div className="card"><span>Ingresos fijos / mes</span><strong className="pos">{eur(sum('income'))}</strong></div>
      </div>

      <div className="card generate">
        <span>Crea en el mes actual los fijos activos como pendientes, con su importe por defecto.
          No duplica los que ya existan. También se hace solo al abrir la app.</span>
        <button className="secondary" onClick={generate} disabled={busy || active.length === 0}>
          {busy ? '…' : `Generar fijos de ${monthName}`}
        </button>
        {info && <span className="pos">{info}</span>}
      </div>

      {items.length === 0 ? (
        <Empty icon="🔁" title="Sin fijos todavía" action={<button onClick={() => setEditing('new')}>+ Crear el primero</button>}>
          Añade lo que pagas o cobras todos los meses: hipoteca, perro, suscripciones, nómina…
        </Empty>
      ) : (
        <ul className="list">{active.map(row)}</ul>
      )}

      {inactive.length > 0 && (
        <>
          <h3 className="sub">Desactivados</h3>
          <ul className="list muted">{inactive.map(row)}</ul>
        </>
      )}

      {err && <p className="msg neg">{err}</p>}

      {editing && (
        <Modal title={editing === 'new' ? 'Nuevo fijo' : editing.name} onClose={close}>
          <RecurringForm item={editing === 'new' ? undefined : editing} cats={cats} onDone={() => { close(); load(); toast('Cambios guardados') }} />
        </Modal>
      )}
    </section>
  )
}

type FormProps = { item?: RecurringItem; cats: Category[]; onDone: () => void }

function RecurringForm({ item, cats, onDone }: FormProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [kind, setKind] = useState<Kind>(item?.kind ?? 'expense')
  const [categoryId, setCategoryId] = useState(item?.category_id ?? '')
  const [amount, setAmount] = useState(item ? String(item.default_amount).replace('.', ',') : '')
  const [day, setDay] = useState(String(item?.day_of_month ?? 1))
  const [active, setActive] = useState(item?.active ?? true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const kindCats = cats.filter((c) => c.kind === kind)

  async function run(action: () => Promise<unknown>) {
    setBusy(true); setErr('')
    try { await action(); onDone() } catch (e) { setErr(errorText(e)) }
    setBusy(false)
  }

  function changeKind(k: Kind) {
    setKind(k)
    // la categoría elegida puede no ser de este tipo
    if (!cats.some((c) => c.id === categoryId && c.kind === k)) setCategoryId('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const a = parseAmount(amount)
    const d = Number(day)
    if (!name.trim()) return setErr('Pon un nombre')
    if (!Number.isFinite(a) || a <= 0) return setErr('Importe no válido. Ejemplo: 650,00')
    if (!Number.isInteger(d) || d < 1 || d > 31) return setErr('Día entre 1 y 31')

    const input: RecurringInput = {
      name: name.trim(),
      kind,
      category_id: categoryId || null,
      default_amount: Math.round(a * 100) / 100,
      day_of_month: d,
      active,
    }
    run(() => (item ? updateRecurring(item.id, input) : createRecurring(input)))
  }

  function remove() {
    if (!item || !confirm(`¿Eliminar "${item.name}"? Los movimientos ya creados se conservan.`)) return
    run(() => deleteRecurring(item.id))
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="segmented" role="radiogroup" aria-label="Tipo">
        {(['expense', 'income'] as Kind[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k}
            className={kind === k ? 'on' : ''} onClick={() => changeKind(k)}>
            {k === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        ))}
      </div>

      <label>
        Nombre
        <input value={name} maxLength={50} onChange={(e) => setName(e.target.value)} placeholder="Hipoteca" autoFocus={!item} />
      </label>

      <label>
        Categoría
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Sin categoría</option>
          {kindCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <div className="grid">
        <label>
          Importe (€)
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" />
        </label>
        <label>
          Día del mes
          <input value={day} onChange={(e) => setDay(e.target.value)} inputMode="numeric" />
        </label>
      </div>
      <p className="msg">Si el mes tiene menos días, se usa el último día.</p>

      <label className="check">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Activo (se genera cada mes)
      </label>

      {err && <p className="msg neg">{err}</p>}

      <button type="submit" disabled={busy}>{busy ? '…' : item ? 'Guardar' : 'Crear fijo'}</button>
      {item && <button type="button" className="danger" disabled={busy} onClick={remove}>Eliminar</button>}
    </form>
  )
}
