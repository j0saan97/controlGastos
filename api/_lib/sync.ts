import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSheetCells } from './sheet.js'

export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

type SheetWallet = {
  id: string
  user_id: string
  sheet_csv_url: string
  sheet_balance_cell: string
  sheet_pnl_cell: string
}

export type SyncResult = { wallet_id: string; ok: boolean; balance?: number; error?: string }

/** Sincroniza las carteras de tipo sheet (todas o solo las de un usuario) */
export async function syncSheetWallets(db: SupabaseClient, userId?: string): Promise<SyncResult[]> {
  let q = db
    .from('wallets')
    .select('id, user_id, sheet_csv_url, sheet_balance_cell, sheet_pnl_cell')
    .eq('source', 'sheet')
    .eq('archived', false)
  if (userId) q = q.eq('user_id', userId)

  const { data, error } = await q
  if (error) throw error

  return Promise.all(
    (data as SheetWallet[]).map(async (w): Promise<SyncResult> => {
      try {
        const { balance, pnl } = await readSheetCells(w.sheet_csv_url, w.sheet_balance_cell, w.sheet_pnl_cell)
        const { error: upErr } = await db
          .from('wallets')
          .update({ balance, last_pnl: pnl, last_synced_at: new Date().toISOString() })
          .eq('id', w.id)
        if (upErr) throw upErr
        return { wallet_id: w.id, ok: true, balance } // el trigger guarda la foto del día
      } catch (e) {
        return { wallet_id: w.id, ok: false, error: (e as Error).message }
      }
    }),
  )
}
