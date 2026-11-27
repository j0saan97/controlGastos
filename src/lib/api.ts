import { supabase } from './supabase'
import type { Category, Dashboard, Kind, RecurringItem, Transaction, Wallet } from '../types/db'

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

// ---------- Gráficos (F9) ----------

export type CategoryTotal = { category: string; color: string | null; total: number; paid: number }
export type MonthTotal = { month: string; income: number; expense: number }
export type NetWorthPoint = { month: string; total: number }

/** Gasto (o ingreso) por categoría en un mes, de mayor a menor */
export async function getCategoryTotals(month: string, kind: Kind = 'expense'): Promise<CategoryTotal[]> {
  const { data, error } = await supabase
    .from('v_category_totals').select('category, color, total, paid').eq('month', month).eq('kind', kind)
  if (error) throw error
  return (data as CategoryTotal[])
    .map((r) => ({ ...r, total: Number(r.total), paid: Number(r.paid) }))
    .sort((a, b) => b.total - a.total)
}

/** Ingresos y gastos de los últimos n meses (incluido el actual); meses sin datos = 0 */
export async function getMonthTotals(n = 6): Promise<MonthTotal[]> {
  const now = new Date()
  const months = Array.from({ length: n }, (_, i) => firstOfMonth(new Date(now.getFullYear(), now.getMonth() - (n - 1) + i, 1)))
  const { data, error } = await supabase
    .from('v_month_totals').select('month, income, expense').gte('month', months[0]).lte('month', months[n - 1])
  if (error) throw error
  const byMonth = new Map((data as MonthTotal[]).map((r) => [r.month, r]))
  return months.map((m) => ({ month: m, income: Number(byMonth.get(m)?.income ?? 0), expense: Number(byMonth.get(m)?.expense ?? 0) }))
}

/** Patrimonio a fin de cada mes (foto diaria de saldos) */
export async function getNetWorthHistory(months = 12): Promise<NetWorthPoint[]> {
  const { data, error } = await supabase.rpc('get_net_worth_history', { p_months: months })
  if (error) throw error
  return (data as NetWorthPoint[]).map((r) => ({ month: r.month, total: Number(r.total) }))
}

/** Gastos pendientes que vencen en los próximos `days` días (y los ya vencidos) */
export async function listUpcoming(days = 7): Promise<Transaction[]> {
  const limit = new Date()
  limit.setDate(limit.getDate() + days)
  const iso = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}-${String(limit.getDate()).padStart(2, '0')}`
  const { data, error } = await supabase
    .from('transactions').select(TX_COLS)
    .eq('status', 'pending').eq('kind', 'expense').lte('due_date', iso)
    .order('due_date')
  if (error) throw error
  return (data as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }))
}

// ---------- Movimientos del mes ----------

export type TxInput = Pick<Transaction, 'month' | 'name' | 'kind' | 'category_id' | 'amount' | 'due_date' | 'note'>

const TX_COLS = 'id, month, name, kind, category_id, amount, is_fixed, recurring_id, due_date, status, wallet_id, paid_at, note'

export async function listTransactions(month: string): Promise<Transaction[]> {
  const { data, error } = await supabase.from('transactions').select(TX_COLS).eq('month', month)
  if (error) throw error
  return (data as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }))
}

/** Crea un movimiento variable; si viene walletId se crea ya pagado (el trigger mueve el saldo) */
export async function createTransaction(t: TxInput, walletId?: string) {
  const paid = walletId ? { status: 'paid', wallet_id: walletId, paid_at: new Date().toISOString() } : {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('transactions').insert({ ...t, ...paid } as any)
  if (error) throw error
}

/** Editar un pagado también vale: el trigger revierte el importe viejo y aplica el nuevo */
export async function updateTransaction(id: string, patch: Partial<TxInput>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('transactions').update(patch as any).eq('id', id)
  if (error) throw error
}

/** Si estaba pagado, el trigger devuelve el dinero a la cartera */
export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

/** Pagar/cobrar con el importe final (p. ej. la luz que varía cada mes) */
export async function payTransaction(id: string, walletId: string, amount: number) {
  const { error } = await supabase
    .from('transactions')
    .update({ amount, status: 'paid', wallet_id: walletId, paid_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
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
  'name' | 'type' | 'balance' | 'source' | 'parent_id' | 'sheet_csv_url' | 'sheet_balance_cell' | 'sheet_pnl_cell'
>

export async function listWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data as unknown as Wallet[]
}

export async function createWallet(w: WalletInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('wallets').insert(w as any)
  if (error) throw error
}

export async function updateWallet(id: string, patch: Partial<WalletInput> & { archived?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('wallets').update(patch as any).eq('id', id)
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
