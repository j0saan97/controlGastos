export type Kind = 'income' | 'expense'

export type Wallet = {
  id: string
  name: string
  type: 'bank' | 'ewallet' | 'poker' | 'cash'
  balance: number
  source: 'manual' | 'sheet'
  sheet_csv_url: string | null
  sheet_balance_cell: string
  sheet_pnl_cell: string
  last_pnl: number | null
  last_synced_at: string | null
  archived: boolean
}

export type Category = { id: string; name: string; kind: Kind; color: string }

export type RecurringItem = {
  id: string
  name: string
  kind: Kind
  category_id: string | null
  default_amount: number
  day_of_month: number
  active: boolean
}

export type Transaction = {
  id: string
  month: string
  name: string
  kind: Kind
  category_id: string | null
  amount: number
  is_fixed: boolean
  recurring_id: string | null
  due_date: string | null
  status: 'pending' | 'paid'
  wallet_id: string | null
  paid_at: string | null
  note: string | null
}

export type Dashboard = {
  total_balance: number
  pending_expenses: number
  pending_income: number
  available: number
  poker_pnl: number | null
}
