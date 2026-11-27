-- =====================================================
-- Migración: P/L de poker incluye salas dentro de un grupo
-- Pegar en Supabase → SQL Editor → Run
-- =====================================================
-- El total sigue sumando solo carteras raíz (el grupo ya incluye a sus salas),
-- pero el P/L del día suma todas las salas de poker que leen del Sheet,
-- estén o no dentro de un grupo.

CREATE OR REPLACE FUNCTION public.get_dashboard(p_month date)
RETURNS TABLE (
  total_balance    numeric,
  pending_expenses numeric,
  pending_income   numeric,
  available        numeric,
  poker_pnl        numeric
)
LANGUAGE sql STABLE AS $$
  WITH w AS (
    SELECT COALESCE(SUM(balance) FILTER (WHERE parent_id IS NULL), 0) AS total,
           SUM(last_pnl) FILTER (WHERE type = 'poker' AND source = 'sheet') AS pnl
      FROM public.wallets
     WHERE user_id = auth.uid() AND NOT archived
  ), t AS (
    SELECT COALESCE(SUM(amount) FILTER (WHERE kind = 'expense' AND status = 'pending'), 0) AS pe,
           COALESCE(SUM(amount) FILTER (WHERE kind = 'income'  AND status = 'pending'), 0) AS pi
      FROM public.transactions
     WHERE user_id = auth.uid() AND month = date_trunc('month', p_month)::date
  )
  SELECT w.total, t.pe, t.pi, w.total - t.pe + t.pi, w.pnl FROM w, t;
$$;
