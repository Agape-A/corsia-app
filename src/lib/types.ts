export type ClasseRAO = 'U' | 'B' | 'D' | 'P' | 'non_specificata'
export type RichiestaStato = 'nuova' | 'in_ricerca' | 'trovato' | 'prenotato' | 'chiusa' | 'annullata'
export type CanalePreferito = 'pubblico' | 'privato' | 'entrambi'
export type CanaleChiamata = 'umano' | 'ai'

export const RAO_LABELS: Record<ClasseRAO, string> = {
  U: 'Urgente (72 ore)',
  B: 'Breve (10 giorni)',
  D: 'Differibile (30-60 giorni)',
  P: 'Programmata (120 giorni)',
  non_specificata: 'Non specificata',
}

export const STATO_LABELS: Record<RichiestaStato, string> = {
  nuova: 'Nuova',
  in_ricerca: 'In ricerca',
  trovato: 'Trovato',
  prenotato: 'Prenotato',
  chiusa: 'Chiusa',
  annullata: 'Annullata',
}

export const STATO_ORDER: RichiestaStato[] = ['nuova', 'in_ricerca', 'trovato', 'prenotato', 'chiusa', 'annullata']

export interface Richiesta {
  id: string
  created_at: string
  updated_at: string
  nome_richiedente: string
  email: string
  telefono: string
  per_conto_di: string | null
  autorizzazione_terzi: boolean
  tipo_prestazione: string
  ha_impegnativa: boolean
  classe_rao: ClasseRAO | null
  data_emissione_ricetta: string | null
  note_libere: string | null
  zona: string | null
  raggio_km: number | null
  canale_preferito: CanalePreferito
  budget_max: number | null
  fascia_oraria_preferita: string | null
  consenso_dati: boolean
  consenso_ricontatto: boolean
  stato: RichiestaStato
  operatore_assegnato: string | null
  struttura_trovata: string | null
  appuntamento_data: string | null
  prezzo: number | null
  scadenza_rao: string | null
}

export interface Chiamata {
  id: string
  richiesta_id: string
  created_at: string
  canale: CanaleChiamata
  operatore: string | null
  struttura_contattata: string | null
  esito: string | null
  esito_positivo: boolean | null
  external_call_id: string | null
  trascrizione: string | null
}
