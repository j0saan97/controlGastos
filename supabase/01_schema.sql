-- =====================================================
-- App gastos · Esquema Supabase (MVP)
-- Pegar entero en Supabase → SQL Editor → Run
-- =====================================================

-- -----------------------------------------------------
-- 1. CARTERAS (banco, skrill, wise, poker, efectivo)
-- -----------------------------------------------------
create table public.wallets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('bank','ewallet','poker','cash')),
  balance         numeric(12,2) not null default 0,
  source          text not null default 'manual' check (source in ('manual','sheet')),
  sheet_csv_url   text,                         -- enlace CSV publicado (pestaña "app")
  sheet_balance_cell text not null default 'A1', -- celda saldo total poker
  sheet_pnl_cell  text not null default 'B1',    -- celda profit/pérdida del día
  last_pnl        numeric(12,2),                -- P/L del día (solo informativo)
  last_synced_at  timestamptz,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  check (source = 'manual' or sheet_csv_url is not null)
);

-- -----------------------------------------------------
-- 2. HISTÓRICO DE SALDOS (1 foto por cartera y día)
-- -----------------------------------------------------
create table public.wallet_snapshots (
  wallet_id  uuid not null references public.wallets(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day        date not null,
  balance    numeric(12,2) not null,
  primary key (wallet_id, day)
);

-- -----------------------------------------------------
-- 3. CATEGORÍAS (libres por usuario)
-- -----------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  kind        text not null check (kind in ('income','expense')),
  color       text not null default '#888888',
  created_at  timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- -----------------------------------------------------
-- 4. PLANTILLAS DE FIJOS (hipoteca, perro, suscripciones...)
-- -----------------------------------------------------
create table public.recurring_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null,
  kind            text not null check (kind in ('income','expense')),
  category_id     uuid references public.categories(id) on delete set null,
  default_amount  numeric(12,2) not null check (default_amount > 0),
  day_of_month    smallint not null default 1 check (day_of_month between 1 and 31),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------
-- 5. MOVIMIENTOS DEL MES (fijos y variables)
-- -----------------------------------------------------
create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month         date not null check (extract(day from month) = 1), -- siempre día 1
  name          text not null,
  kind          text not null check (kind in ('income','expense')),
  category_id   uuid references public.categories(id) on delete set null,
  amount        numeric(12,2) not null check (amount > 0),
  is_fixed      boolean not null default false,
  recurring_id  uuid references public.recurring_items(id) on delete set null,
  due_date      date,
  status        text not null default 'pending' check (status in ('pending','paid')),
  wallet_id     uuid references public.wallets(id),   -- de dónde sale / dónde entra
  paid_at       timestamptz,
  note          text,
  created_at    timestamptz not null default now(),
  check (
    (status = 'pending' and wallet_id is null and paid_at is null) or
    (status = 'paid'    and wallet_id is not null and paid_at is not null)
  )
);

create index transactions_user_month_idx on public.transactions (user_id, month);
create unique index transactions_recurring_month_uq
  on public.transactions (recurring_id, month) where recurring_id is not null;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- 6. Pagado/cobrado → mueve saldo de la cartera elegida.
--    Desmarcar, editar importe/cartera o borrar → revierte solo.
create or replace function public.tx_apply_balance()
returns trigger language plpgsql as $$
begin
  -- revertir efecto anterior
  if tg_op in ('UPDATE','DELETE') and old.status = 'paid' then
    update public.wallets
       set balance = balance - case when old.kind = 'income' then old.amount else -old.amount end
     where id = old.wallet_id;
  end if;

  -- aplicar efecto nuevo
  if tg_op in ('INSERT','UPDATE') and new.status = 'paid' then
    if not exists (select 1 from public.wallets w
                    where w.id = new.wallet_id and w.user_id = new.user_id) then
      raise exception 'Cartera no válida';
    end if;
    update public.wallets
       set balance = balance + case when new.kind = 'income' then new.amount else -new.amount end
     where id = new.wallet_id;
  end if;

  return null; -- AFTER trigger
end $$;

create trigger transactions_balance
after insert or update or delete on public.transactions
for each row execute function public.tx_apply_balance();

-- 7. Cada cambio de saldo → foto del día (para evolución mensual)
create or replace function public.wallet_snapshot()
returns trigger language plpgsql as $$
begin
  insert into public.wallet_snapshots (wallet_id, user_id, day, balance)
  values (new.id, new.user_id, (now() at time zone 'Europe/Madrid')::date, new.balance)
  on conflict (wallet_id, day) do update set balance = excluded.balance;
  return null;
end $$;

create trigger wallets_snapshot
after insert or update of balance on public.wallets
for each row execute function public.wallet_snapshot();

-- =====================================================
-- FUNCIONES (RPC desde el front)
-- =====================================================

-- 8. Genera los fijos del mes con su importe por defecto (no duplica)
--    Front: supabase.rpc('generate_month', { p_month: '2026-12-01' })
create or replace function public.generate_month(p_month date)
returns integer language plpgsql as $$
declare
  v_month date := date_trunc('month', p_month)::date;
  n integer;
begin
  insert into public.transactions
    (user_id, month, name, kind, category_id, amount, is_fixed, recurring_id, due_date)
  select r.user_id, v_month, r.name, r.kind, r.category_id, r.default_amount, true, r.id,
         least(v_month + (r.day_of_month - 1), (v_month + interval '1 month - 1 day')::date)
    from public.recurring_items r
   where r.user_id = auth.uid() and r.active
  on conflict (recurring_id, month) where recurring_id is not null do nothing;

  get diagnostics n = row_count;
  return n;
end $$;

-- 9. Dashboard: total, obligaciones, disponible real, P/L poker hoy
create or replace function public.get_dashboard(p_month date)
returns table (
  total_balance    numeric,
  pending_expenses numeric,
  pending_income   numeric,
  available        numeric,
  poker_pnl        numeric
)
language sql stable as $$
  with w as (
    select coalesce(sum(balance), 0) as total,
           max(last_pnl) filter (where type = 'poker') as pnl
      from public.wallets
     where user_id = auth.uid() and not archived
  ), t as (
    select coalesce(sum(amount) filter (where kind = 'expense' and status = 'pending'), 0) as pe,
           coalesce(sum(amount) filter (where kind = 'income'  and status = 'pending'), 0) as pi
      from public.transactions
     where user_id = auth.uid() and month = date_trunc('month', p_month)::date
  )
  select w.total, t.pe, t.pi, w.total - t.pe + t.pi, w.pnl from w, t;
$$;

-- 10. Patrimonio a fin de cada mes (últimos N meses)
create or replace function public.get_net_worth_history(p_months int default 12)
returns table (month date, total numeric)
language sql stable as $$
  select m::date, coalesce(sum(s.balance), 0)
    from generate_series(
           date_trunc('month', now()) - make_interval(months => p_months - 1),
           date_trunc('month', now()),
           interval '1 month') as m
    left join lateral (
      select distinct on (ws.wallet_id) ws.balance
        from public.wallet_snapshots ws
       where ws.user_id = auth.uid()
         and ws.day < (m + interval '1 month')::date
       order by ws.wallet_id, ws.day desc
    ) s on true
   group by m
   order by m;
$$;

-- =====================================================
-- VISTAS (gráficos)
-- =====================================================

-- 11. Gasto/ingreso por categoría y mes
create view public.v_category_totals with (security_invoker = true) as
select t.user_id, t.month, t.kind, t.category_id,
       coalesce(c.name, 'Sin categoría') as category,
       c.color,
       sum(t.amount) as total,
       coalesce(sum(t.amount) filter (where t.status = 'paid'), 0) as paid
  from public.transactions t
  left join public.categories c on c.id = t.category_id
 group by t.user_id, t.month, t.kind, t.category_id, c.name, c.color;

-- 12. Ingresos vs gastos por mes
create view public.v_month_totals with (security_invoker = true) as
select user_id, month,
       coalesce(sum(amount) filter (where kind = 'income'), 0)  as income,
       coalesce(sum(amount) filter (where kind = 'expense'), 0) as expense
  from public.transactions
 group by user_id, month;

-- =====================================================
-- 13. RLS: cada usuario solo ve lo suyo
-- =====================================================
alter table public.wallets          enable row level security;
alter table public.wallet_snapshots enable row level security;
alter table public.categories       enable row level security;
alter table public.recurring_items  enable row level security;
alter table public.transactions     enable row level security;

create policy own_rows on public.wallets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_rows on public.wallet_snapshots for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_rows on public.categories for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_rows on public.recurring_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_rows on public.transactions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
