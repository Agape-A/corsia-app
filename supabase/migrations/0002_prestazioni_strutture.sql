-- Corsia — database delle strutture (fase "lato staff")
-- Aggiunge il catalogo delle prestazioni (tassonomia interna provvisoria,
-- da riconciliare più avanti con il Nomenclatore Tariffario Nazionale
-- ufficiale) e le strutture sanitarie con le prestazioni che erogano,
-- così la Pipeline può calcolare da sola una lista ristretta di candidate
-- per ogni richiesta invece di far cercare tutto a mano all'operatore.

create table public.prestazioni (
  codice text primary key,          -- slug interno, es. 'rm-ginocchio' (non il codice ministeriale ufficiale)
  nome text not null,
  categoria text,
  sinonimi text[] not null default '{}'
);

create type public.tipo_struttura as enum ('pubblico', 'privato_convenzionato', 'privato');

create table public.strutture (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  nome text not null,
  tipo public.tipo_struttura not null default 'privato',
  indirizzo text,
  comune text,
  cap text,
  provincia text,
  telefono text,
  note text,
  fonte text                        -- da dove viene il dato: 'manuale', 'google_places', 'cup_regionale', ecc.
);

create table public.strutture_prestazioni (
  id uuid primary key default gen_random_uuid(),
  struttura_id uuid not null references public.strutture(id) on delete cascade,
  prestazione_codice text not null references public.prestazioni(codice) on delete cascade,
  disponibilita_online boolean not null default false,   -- true = si può verificare/prenotare online, senza chiamare
  note text,
  created_at timestamptz not null default now(),
  unique (struttura_id, prestazione_codice)
);

-- la richiesta pubblica porta con sé il codice prestazione normalizzato
-- (risolto dal traduttore IA, quando disponibile)
alter table public.richieste add column prestazione_codice text references public.prestazioni(codice);

create index strutture_comune_idx on public.strutture (comune);
create index strutture_prestazioni_struttura_idx on public.strutture_prestazioni (struttura_id);
create index strutture_prestazioni_prestazione_idx on public.strutture_prestazioni (prestazione_codice);

create trigger strutture_set_updated_at
  before update on public.strutture
  for each row execute function public.set_updated_at();

-- RLS: il catalogo prestazioni è dato di riferimento, leggibile da chiunque
-- (serve anche alla function pubblica che traduce le richieste); strutture
-- e collegamenti struttura↔prestazione sono gestiti solo dallo staff.
alter table public.prestazioni enable row level security;
alter table public.strutture enable row level security;
alter table public.strutture_prestazioni enable row level security;

create policy "prestazioni_select_all" on public.prestazioni
  for select
  using (true);

create policy "prestazioni_insert_staff" on public.prestazioni
  for insert
  with check (auth.role() = 'authenticated');

create policy "prestazioni_update_staff" on public.prestazioni
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "prestazioni_delete_staff" on public.prestazioni
  for delete
  using (auth.role() = 'authenticated');

create policy "strutture_all_staff" on public.strutture
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "strutture_prestazioni_all_staff" on public.strutture_prestazioni
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Catalogo di partenza: ~30 prestazioni comuni, per non partire da un
-- database vuoto. Vanno ampliate/corrette man mano dallo staff.
insert into public.prestazioni (codice, nome, categoria, sinonimi) values
  ('rx-torace', 'Radiografia del torace', 'Radiologia', array['lastra torace','rx torace','radiografia polmoni']),
  ('rx-ginocchio', 'Radiografia al ginocchio', 'Radiologia', array['lastra ginocchio','rx ginocchio']),
  ('rm-ginocchio', 'Risonanza magnetica al ginocchio', 'Radiologia', array['rm ginocchio','risonanza ginocchio']),
  ('rm-colonna', 'Risonanza magnetica alla colonna vertebrale', 'Radiologia', array['rm schiena','risonanza colonna','rm colonna lombare']),
  ('tc-torace', 'TAC del torace', 'Radiologia', array['tac torace','tomografia torace']),
  ('eco-addome', 'Ecografia addome completo', 'Radiologia', array['ecografia pancia','eco addome']),
  ('eco-tiroide', 'Ecografia tiroidea', 'Radiologia', array['ecografia tiroide']),
  ('mammografia', 'Mammografia', 'Radiologia', array['screening seno']),
  ('densitometria', 'Densitometria ossea (MOC)', 'Radiologia', array['moc','densitometria ossea']),
  ('visita-cardiologica', 'Visita cardiologica', 'Cardiologia', array['controllo cuore','visita cuore']),
  ('ecg', 'Elettrocardiogramma', 'Cardiologia', array['ecg','elettrocardiogramma']),
  ('ecocardiogramma', 'Ecocardiogramma', 'Cardiologia', array['eco cuore','ecocardio']),
  ('holter-cardiaco', 'Holter cardiaco (24 ore)', 'Cardiologia', array['holter']),
  ('visita-ortopedica', 'Visita ortopedica', 'Ortopedia', array['controllo ortopedico']),
  ('visita-oculistica', 'Visita oculistica', 'Oculistica', array['controllo occhi','visita occhi']),
  ('visita-otorino', 'Visita otorinolaringoiatrica', 'Otorinolaringoiatria', array['visita orecchio naso gola','otorino']),
  ('visita-dermatologica', 'Visita dermatologica', 'Dermatologia', array['controllo pelle','visita pelle']),
  ('visita-ginecologica', 'Visita ginecologica', 'Ginecologia', array['controllo ginecologico']),
  ('pap-test', 'Pap test', 'Ginecologia', array['pap test']),
  ('visita-neurologica', 'Visita neurologica', 'Neurologia', array['controllo neurologico']),
  ('eeg', 'Elettroencefalogramma', 'Neurologia', array['eeg']),
  ('visita-endocrinologica', 'Visita endocrinologica', 'Endocrinologia', array['controllo tiroide visita']),
  ('esami-sangue', 'Prelievo ed esami del sangue di routine', 'Laboratorio', array['analisi sangue','esami sangue']),
  ('colonscopia', 'Colonscopia', 'Gastroenterologia', array['colonscopia']),
  ('gastroscopia', 'Gastroscopia (EGDS)', 'Gastroenterologia', array['gastroscopia']),
  ('visita-urologica', 'Visita urologica', 'Urologia', array['controllo urologico']),
  ('visita-fisiatrica', 'Visita fisiatrica', 'Fisioterapia', array['controllo fisiatrico']),
  ('fisioterapia-seduta', 'Seduta di fisioterapia', 'Fisioterapia', array['fisioterapia','riabilitazione']),
  ('spirometria', 'Spirometria', 'Pneumologia', array['prova respiro','spirometria']),
  ('visita-pneumologica', 'Visita pneumologica', 'Pneumologia', array['controllo polmoni']);
