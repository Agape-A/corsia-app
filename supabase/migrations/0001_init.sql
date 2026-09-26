-- Corsia — schema iniziale
-- Pipeline richieste (sostituisce Airtable) + log chiamate, pronto sia per
-- l'operatore umano (fase 1) sia per l'integrazione futura di un operatore
-- telefonico AI (fase 2, es. Retell AI) tramite il campo "canale" e
-- "external_call_id" su chiamate.

create extension if not exists pgcrypto;

create type public.rao_class as enum ('U','B','D','P','non_specificata');
create type public.richiesta_stato as enum ('nuova','in_ricerca','trovato','prenotato','chiusa','annullata');
create type public.canale_preferito as enum ('pubblico','privato','entrambi');
create type public.canale_chiamata as enum ('umano','ai');

create table public.richieste (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  nome_richiedente text not null,
  email text not null,
  telefono text not null,

  per_conto_di text,                      -- null = per sé stesso
  autorizzazione_terzi boolean not null default false,

  tipo_prestazione text not null,
  ha_impegnativa boolean not null default false,
  classe_rao public.rao_class,
  data_emissione_ricetta date,
  note_libere text,

  zona text,
  raggio_km int,
  canale_preferito public.canale_preferito not null default 'entrambi',
  budget_max numeric,
  fascia_oraria_preferita text,

  consenso_dati boolean not null default false,
  consenso_ricontatto boolean not null default false,

  stato public.richiesta_stato not null default 'nuova',
  operatore_assegnato uuid references auth.users(id),

  struttura_trovata text,                 -- MAI esposto al pubblico prima della prenotazione
  appuntamento_data timestamptz,
  prezzo numeric,

  scadenza_rao date generated always as (
    case classe_rao
      when 'U' then (data_emissione_ricetta + interval '3 days')::date
      when 'B' then (data_emissione_ricetta + interval '10 days')::date
      when 'D' then (data_emissione_ricetta + interval '60 days')::date
      when 'P' then (data_emissione_ricetta + interval '120 days')::date
      else null
    end
  ) stored
);

create table public.chiamate (
  id uuid primary key default gen_random_uuid(),
  richiesta_id uuid not null references public.richieste(id) on delete cascade,
  created_at timestamptz not null default now(),
  canale public.canale_chiamata not null default 'umano',
  operatore uuid references auth.users(id),
  struttura_contattata text,
  esito text,
  esito_positivo boolean,
  external_call_id text,                  -- correlazione con la piattaforma voice AI (es. Retell)
  trascrizione text
);

create index richieste_stato_idx on public.richieste (stato);
create index richieste_created_at_idx on public.richieste (created_at desc);
create index chiamate_richiesta_id_idx on public.chiamate (richiesta_id);

-- updated_at automatico
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger richieste_set_updated_at
  before update on public.richieste
  for each row execute function public.set_updated_at();

-- RLS: il pubblico può solo INSERIRE una richiesta (il form), mai leggerle.
-- Lo staff (qualsiasi utente autenticato, per l'alpha) legge e gestisce tutto.
alter table public.richieste enable row level security;
alter table public.chiamate enable row level security;

create policy "richieste_insert_public" on public.richieste
  for insert
  with check (true);

create policy "richieste_select_staff" on public.richieste
  for select
  using (auth.role() = 'authenticated');

create policy "richieste_update_staff" on public.richieste
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "chiamate_all_staff" on public.chiamate
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
