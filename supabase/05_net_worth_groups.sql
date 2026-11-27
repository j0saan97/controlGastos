-- =====================================================
-- Migración: evolución del patrimonio sin contar doble los grupos
-- Pegar en Supabase → SQL Editor → Run
-- =====================================================
-- Antes sumaba las fotos de TODAS las carteras: el grupo (BancaPoker)
-- y además cada sala → el poker contaba dos veces.
-- Ahora solo suma carteras raíz (parent_id IS NULL) y no archivadas,
-- igual que el total del dashboard.

CREATE OR REPLACE FUNCTION public.get_net_worth_history(p_months int DEFAULT 12)
RETURNS TABLE (month date, total numeric)
LANGUAGE sql STABLE AS $$
  SELECT m::date, COALESCE(SUM(s.balance), 0)
    FROM generate_series(
           date_trunc('month', now()) - make_interval(months => p_months - 1),
           date_trunc('month', now()),
           interval '1 month') AS m
    LEFT JOIN LATERAL (
      SELECT DISTINCT ON (ws.wallet_id) ws.balance
        FROM public.wallet_snapshots ws
        JOIN public.wallets w ON w.id = ws.wallet_id
       WHERE ws.user_id = auth.uid()
         AND w.parent_id IS NULL
         AND NOT w.archived
         AND ws.day < (m + interval '1 month')::date
       ORDER BY ws.wallet_id, ws.day DESC
    ) s ON true
   GROUP BY m
   ORDER BY m;
$$;
