import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createCategories, deleteCategory, listCategories, updateCategory, type CategoryInput,
} from '../lib/api'
import type { Category, Kind } from '../types/db'
import Modal from '../components/Modal'

const COLORS = ['#4f8cff', '#3ecf8e', '#ff6b6b', '#f5a524', '#a970ff', '#ff7ac6', '#2ec4d6', '#c0c4cc', '#8b5a2b', '#e4e45c']

const KIND_LABEL: Record<Kind, string> = { expense: 'Gastos', income: 'Ingresos' }

const SUGGESTED: CategoryInput[] = [
  { kind: 'expense', name: 'Vivienda', color: '#4f8cff' },
  { kind: 'expense', name: 'Supermercado', color: '#3ecf8e' },
  { kind: 'expense', name: 'Suministros', color: '#f5a524' },
  { kind: 'expense', name: 'Suscripciones', color: '#a970ff' },
  { kind: 'expense', name: 'Mascota', color: '#8b5a2b' },
  { kind: 'expense', name: 'Transporte', color: '#2ec4d6' },
  { kind: 'expense', name: 'Ocio', color: '#ff7ac6' },
  { kind: 'income', name: 'Nómina', color: '#3ecf8e' },
  { kind: 'income', name: 'Poker', color: '#4f8cff' },
  { kind: 'income', name: 'Otros ingresos', color: '#c0c4cc' },
]

type Editing = { category?: Category; kind: Kind }

export default function Categories() {
  const [cats, setCats] = useState<Category[] | null>(null)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)

  const load = useCallback(async () => {
    try { setCats(await listCategories()) } catch (e) { setErr((e as Error).message) }
  }, [])

  useEffect(() => { load() }, [load])

  const close = useCallback(() => setEditing(null), [])

  async function addSuggested() {
    setErr('')
    try { await createCategories(SUGGESTED); await load() } catch (e) { setErr((e as Error).message) }
  }

  if (!cats) return <p>{err || 'Cargando…'}</p>

  return (
    <section>
      <header className="row">
        <h2>Categorías</h2>
      </header>

      {cats.length === 0 && (
        <div className="card">
          <span>Aún no tienes categorías. Puedes crearlas una a una o empezar con unas sugeridas
            (las podrás editar o borrar).</span>
          <button onClick={addSuggested}>Crear categorías sugeridas</button>
        </div>
      )}

      {(['expense', 'income'] as Kind[]).map((kind) => {
        const list = cats.filter((c) => c.kind === kind)
        return (
          <div key={kind} className="group">
            <header className="row">
              <h3>{KIND_LABEL[kind]}</h3>
              <button className="secondary small" onClick={() => setEditing({ kind })}>+ Añadir</button>
            </header>
            {list.length === 0 ? (
              <p className="msg">Ninguna todavía.</p>
            ) : (
              <ul className="list">
                {list.map((c) => (
                  <li key={c.id}>
                    <button className="list-item" onClick={() => setEditing({ category: c, kind })}>
                      <div className="with-dot">
                        <i className="dot" style={{ background: c.color }} />
                        <strong>{c.name}</strong>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}

      {err && <p className="msg neg">{err}</p>}

      {editing && (
        <Modal
          title={editing.category ? editing.category.name : `Nueva categoría de ${KIND_LABEL[editing.kind].toLowerCase()}`}
          onClose={close}
        >
          <CategoryForm {...editing} onDone={() => { close(); load() }} />
        </Modal>
      )}
    </section>
  )
}

function CategoryForm({ category, kind, onDone }: Editing & { onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? COLORS[0])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function run(action: () => Promise<unknown>) {
    setBusy(true); setErr('')
    try { await action(); onDone() } catch (e) { setErr((e as Error).message) }
    setBusy(false)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setErr('Pon un nombre')
    run(() => (category ? updateCategory(category.id, { name: n, color }) : createCategories([{ name: n, kind, color }])))
  }

  function remove() {
    if (!category || !confirm(`¿Eliminar "${category.name}"? Sus movimientos quedarán "Sin categoría".`)) return
    run(() => deleteCategory(category.id))
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supermercado" autoFocus={!category} />
      </label>

      <fieldset className="swatches">
        <legend>Color</legend>
        {COLORS.map((c) => (
          <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={color === c}
            className={color === c ? 'swatch on' : 'swatch'} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </fieldset>

      {err && <p className="msg neg">{err}</p>}

      <button type="submit" disabled={busy}>{busy ? '…' : category ? 'Guardar' : 'Crear categoría'}</button>
      {category && <button type="button" className="danger" disabled={busy} onClick={remove}>Eliminar</button>}
    </form>
  )
}
