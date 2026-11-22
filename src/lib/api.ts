import { supabase } from './supabase'
import type { Dashboard } from '../types/db'

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

export async function generateMonth(month = firstOfMonth()) {
  const { data, error } = await supabase.rpc('generate_month', { p_month: month })
  if (error) throw error
  return data as number
}
