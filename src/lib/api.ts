import { supabase } from './supabase'
import type { Category, Dashboard, Kind, RecurringItem, Wallet } from '../types/db'

// ---------- Fijos (plantillas) ----------

export type RecurringInput = Omit<RecurringItem, 'id'>

export async function listRecurring(): Promise<RecurringItem[]> {
  const { data, error } = await supabase
    .from('recurring_items')
    .select('id, name, kind, category_id, default_amount, day_of_month, active')
    .order('day_of_month')
    .order('name')
  if (error) throw error
  return data as RecurringItem[]
}

export async function createRecurring(r: RecurringInput) {
  const { error } = await supabase.from('recurring_items').insert(r)
  if (error) throw error
}

export async function updateRecurring(id: string, patch: Partial<RecurringInput>) {
  const { error } = await supabase.from('recurring_items').update(patch).eq('id', id)
  if (error) throw error
}

/** Los movimientos ya generados se conservan (recurring_id → null) */
export async function deleteRecurring(id: string) {
  const { error } = await supabase.from('recurring_items').delete().eq('id', id)
  if (error) throw error
}

// ---------- Categorías ----------

export type CategoryInput = { name: string; kind: Kind; color: string }

const DUPLICATE = '23505'

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('id, name, kind, color').order('name')
  if (error) throw error
  return data as Category[]
}

export async function createCategories(rows: CategoryInput[]) {
  const { error } = await supabase.from('categories').insert(rows)
  if (error?.code === DUPLICATE) throw new Error('Ya existe una categoría con ese nombre')
  if (error) throw error
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>) {
  const { error } = await supabase.from('categories').update(patch).eq('id', id)
  if (error?.code === DUPLICATE) throw new Error('Ya existe una categoría con ese nombre')
  if (error) throw error
}

/** Los movimientos y fijos que la usaban quedan "Sin categoría" (FK on delete set null) */
export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export const eur = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

export const firstOfMonth = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`

export async function getDashboard(month = firstOfMonth()): Promise<Dashboard> {
  const { data, error } = await supabase.rpc('get_dashboard', { p_month: month })
  if (error) throw error
  return data[0]
}

/** Lee el Google Sheet ahora (botón Refrescar) */
export async function syncSheet() {
  const { data } = await supabase.auth.getSession()
  const res = await fetch('/api/sync-sheet', {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session?.access_token}` },
  })
  if (!res.ok) throw new Error(`Sync falló (${res.status})`)
  return res.json()
}

/** Marca un movimiento como pagado/cobrado desde una cartera */
export async function markPaid(txId: string, walletId: string) {
  const { error } = await supabase
    .from('transactions')
    .update({ status: 'paid', wallet_id: walletId, paid_at: new Date().toISOString() })
    .eq('id', txId)
  if (error) throw error
}

/** Vuelve a pendiente (el trigger devuelve el dinero a la cartera) */
export async function markPending(txId: string) {
  const { error } = await supabase
    .from('transactions')
    .update({ status: 'pending', wallet_id: null, paid_at: null })
    .eq('id', txId)
  if (error) throw error
}

// ---------- Carteras ----------

export type WalletInput = Pick<
  Wallet,
  'name' | 'type' | 'balance' | 'source' | 'sheet_csv_url' | 'sheet_balance_cell' | 'sheet_pnl_cell'
>

export async function listWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data as Wallet[]
}

export async function createWallet(w: WalletInput) {
  const { error } = await supabase.from('wallets').insert(w)
  if (error) throw error
}

export async function updateWallet(id: string, patch: Partial<WalletInput> & { archived?: boolean }) {
  const { error } = await supabase.from('wallets').update(patch).eq('id', id)
  if (error) throw error
}

/** Solo se puede borrar si ningún movimiento pagado apunta a ella (FK) */
export async function deleteWallet(id: string) {
  const { error } = await supabase.from('wallets').delete().eq('id', id)
  if (error?.code === '23503') throw new Error('Tiene movimientos pagados. Archívala en su lugar.')
  if (error) throw error
}

export async function generateMonth(month = firstOfMonth()) {
  const { data, error } = await supabase.rpc('generate_month', { p_month: month })
  if (error) throw error
  return data as number
}
