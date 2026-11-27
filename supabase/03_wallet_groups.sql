-- =====================================================
-- Migración: carteras agrupadas (saldoPoker, etc.)
-- Pegar en Supabase → SQL Editor → Run
-- =====================================================

-- 1. Columna parent_id (relación padre→hijos)
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS parent_id uuid references public.wallets(id) on delete set null;

-- 2. Trigger: cuando cambia el saldo/estado de un hijo, recalcula el padre
CREATE OR REPLACE FUNCTION public.sync_parent_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_parent uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_parent := OLD.parent_id;
  ELSE
    v_parent := NEW.parent_id;
    -- Si cambió de grupo, recalcula también el grupo anterior
    IF TG_OP = 'UPDATE'
       AND OLD.parent_id IS DISTINCT FROM NEW.parent_id
       AND OLD.parent_id IS NOT NULL THEN
      UPDATE public.wallets
         SET balance = (
           SELECT COALESCE(SUM(balance), 0)
             FROM public.wallets
            WHERE parent_id = OLD.parent_id AND NOT archived
         )
       WHERE id = OLD.parent_id;
    END IF;
  END IF;

  IF v_parent IS NOT NULL THEN
    UPDATE public.wallets
       SET balance = (
         SELECT COALESCE(SUM(balance), 0)
           FROM public.wallets
          WHERE parent_id = v_parent AND NOT archived
       )
     WHERE id = v_parent;
  END IF;

  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS wallets_sync_parent ON public.wallets;
CREATE TRIGGER wallets_sync_parent
AFTER INSERT OR UPDATE OF balance, parent_id, archived
OR DELETE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.sync_parent_balance();

-- 3. get_dashboard: solo suma carteras raíz (parent_id IS NULL)
--    para no doblar-contar los hijos que ya están en el padre
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
    SELECT COALESCE(SUM(balance), 0) AS total,
           MAX(last_pnl) FILTER (WHERE type = 'poker') AS pnl
      FROM public.wallets
     WHERE user_id = auth.uid() AND NOT archived AND parent_id IS NULL
  ), t AS (
    SELECT COALESCE(SUM(amount) FILTER (WHERE kind = 'expense' AND status = 'pending'), 0) AS pe,
           COALESCE(SUM(amount) FILTER (WHERE kind = 'income'  AND status = 'pending'), 0) AS pi
      FROM public.transactions
     WHERE user_id = auth.uid() AND month = date_trunc('month', p_month)::date
  )
  SELECT w.total, t.pe, t.pi, w.total - t.pe + t.pi, w.pnl FROM w, t;
$$;
