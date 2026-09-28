import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CanalePreferito, ClasseRAO } from '../lib/types'
import { RAO_LABELS } from '../lib/types'

const TOTAL_STEPS = 4

const RAGGIO_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '20', label: '20 km' },
  { value: '50', label: '50 km' },
  { value: '999', label: 'Tutta la regione' },
]

const CANALE_OPTIONS: { value: CanalePreferito; label: string }[] = [
  { value: 'pubblico', label: 'Solo pubblico (CUP)' },
  { value: 'privato', label: 'Solo privato convenzionato' },
  { value: 'entrambi', label: 'Entrambi' },
]

const RAO_OPTIONS: ClasseRAO[] = ['U', 'B', 'D', 'P']

interface FormValues {
  tipo_prestazione: string
  haImpegnativa: boolean
  classe_rao: ClasseRAO | ''
  data_emissione_ricetta: string
  note_libere: string
  zona: string
  raggio_km: string
  canale_preferito: CanalePreferito
  budget_max: string
  fascia_oraria_preferita: string
  perAltri: boolean
  per_conto_di: string
  autorizzazione_terzi: boolean
  nome_richiedente: string
  email: string
  telefono: string
  consenso_dati: boolean
  consenso_ricontatto: boolean
}

function BackIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export default function Richiedi() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [values, setValues] = useState<FormValues>(() => {
    const qClasse = searchParams.get('classe') as ClasseRAO | null
    const qData = searchParams.get('data')
    return {
      tipo_prestazione: '',
      haImpegnativa: !!qClasse,
      classe_rao: qClasse ?? '',
      data_emissione_ricetta: qData ?? '',
      note_libere: '',
      zona: '',
      raggio_km: '20',
      canale_preferito: 'entrambi',
      budget_max: '',
      fascia_oraria_preferita: '',
      perAltri: false,
      per_conto_di: '',
      autorizzazione_terzi: false,
      nome_richiedente: '',
      email: '',
      telefono: '',
      consenso_dati: false,
      consenso_ricontatto: false,
    }
  })

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  function goBack() {
    setError(null)
    if (step === 0) {
      navigate('/')
    } else {
      setStep((s) => s - 1)
    }
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!values.tipo_prestazione.trim()) return 'Dicci di cosa hai bisogno.'
      if (values.haImpegnativa) {
        if (!values.classe_rao) return 'Seleziona la classe di priorità sulla ricetta.'
        if (!values.data_emissione_ricetta) return "Inserisci la data di emissione della ricetta."
      }
    }
    if (step === 1) {
      if (!values.zona.trim()) return 'Dicci in che zona cercare.'
    }
    if (step === 2) {
      if (!values.nome_richiedente.trim()) return 'Inserisci nome e cognome.'
      if (!values.email.trim()) return "Inserisci un'email."
      if (!values.telefono.trim()) return 'Inserisci un numero di telefono.'
      if (values.perAltri) {
        if (!values.per_conto_di.trim()) return 'Inserisci il nome della persona.'
        if (!values.autorizzazione_terzi) return 'Conferma di essere autorizzato/a ad agire per questa persona.'
      }
    }
    return null
  }

  function handleNext() {
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    if (!values.consenso_dati || !values.consenso_ricontatto) {
      setError('Serve il consenso al trattamento dati e al ricontatto per procedere.')
      return
    }
    setError(null)
    setSubmitting(true)
    const { error: dbError } = await supabase.from('richieste').insert({
      nome_richiedente: values.nome_richiedente,
      email: values.email,
      telefono: values.telefono,
      per_conto_di: values.perAltri ? values.per_conto_di : null,
      autorizzazione_terzi: values.perAltri ? values.autorizzazione_terzi : false,
      tipo_prestazione: values.tipo_prestazione,
      ha_impegnativa: values.haImpegnativa,
      classe_rao: values.haImpegnativa ? (values.classe_rao as ClasseRAO) : null,
      data_emissione_ricetta: values.haImpegnativa ? values.data_emissione_ricetta : null,
      note_libere: !values.haImpegnativa ? (values.note_libere || null) : null,
      zona: values.zona,
      raggio_km: Number(values.raggio_km),
      canale_preferito: values.canale_preferito,
      budget_max: values.budget_max ? Number(values.budget_max) : null,
      fascia_oraria_preferita: values.fascia_oraria_preferita || null,
      consenso_dati: values.consenso_dati,
      consenso_ricontatto: values.consenso_ricontatto,
    })
    setSubmitting(false)
    if (dbError) {
      setError('Qualcosa è andato storto. Riprova tra poco.')
      console.error(dbError)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="app-shell">
        <div className="screen card-on-desktop">
          <div className="brand-row" style={{ padding: '24px 24px 0 24px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h11" /><path d="M11 6l6 6-6 6" /><path d="M19 5v14" />
            </svg>
            <span className="brand-word">Corsia</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: 24, gap: 32 }}>
            <div className="pulse-wrap">
              <div className="pulse-ring" />
              <div className="pulse-ring d2" />
              <div className="pulse-ring d3" />
              <div className="pulse-core">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--navy-ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 21, color: 'var(--ink)' }}>Stiamo cercando per te</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-soft)', maxWidth: 280 }}>
                {values.tipo_prestazione} — zona {values.zona}. Ti ricontattiamo al {values.telefono} appena troviamo la prima disponibilità.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 300, marginTop: 8 }}>
              <div className="checklist-item">
                <div className="checklist-dot-done">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--navy-ink)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Richiesta ricevuta</div>
              </div>
              <div className="checklist-item">
                <div className="checklist-dot-pending" />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>In ricerca sul CUP pubblico e sul privato convenzionato</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="screen card-on-desktop">
        <div className="topbar">
          <button className="back-btn" onClick={goBack} aria-label="Indietro"><BackIcon /></button>
          <div className="topbar-title">
            {step === 0 && 'Cosa ti serve?'}
            {step === 1 && 'Dove cerchiamo?'}
            {step === 2 && 'Chi sei?'}
            {step === 3 && 'Ultimo passo'}
          </div>
        </div>

        <div className="progress-dots">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="step-body">
          {step === 0 && (
            <>
              <div className="field">
                <label>Tipo di visita o esame</label>
                <input
                  type="text"
                  placeholder="Es. Risonanza magnetica ginocchio"
                  value={values.tipo_prestazione}
                  onChange={(e) => set('tipo_prestazione', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Hai già un'impegnativa (ricetta) del SSN?</label>
                <div className="chip-row">
                  <button type="button" className={`chip ${values.haImpegnativa ? 'selected' : ''}`} onClick={() => set('haImpegnativa', true)}>Sì</button>
                  <button type="button" className={`chip ${!values.haImpegnativa ? 'selected' : ''}`} onClick={() => set('haImpegnativa', false)}>No</button>
                </div>
              </div>

              {values.haImpegnativa ? (
                <>
                  <div className="field">
                    <label>Classe di priorità (sulla ricetta, in un cerchietto rosso)</label>
                    <div className="option-list">
                      {RAO_OPTIONS.map((id) => (
                        <button
                          key={id}
                          type="button"
                          className={`option-row ${values.classe_rao === id ? 'selected' : ''}`}
                          onClick={() => set('classe_rao', id)}
                        >
                          <span className="option-badge">{id}</span>
                          <span style={{ flexGrow: 1, textAlign: 'left' }}>{RAO_LABELS[id]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label>Data di emissione della ricetta</label>
                    <input
                      type="date"
                      value={values.data_emissione_ricetta}
                      onChange={(e) => set('data_emissione_ricetta', e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="field">
                  <label>Note (facoltativo)</label>
                  <textarea
                    rows={3}
                    placeholder="Cosa ti serve, in breve"
                    value={values.note_libere}
                    onChange={(e) => set('note_libere', e.target.value)}
                  />
                </div>
              )}

              <div className="info-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
                <div>Non chiediamo tessera sanitaria o diagnosi in questa fase — solo il necessario per cercare la prima disponibilità.</div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="field">
                <label>Zona (CAP o città)</label>
                <input type="text" placeholder="Città o CAP" value={values.zona} onChange={(e) => set('zona', e.target.value)} />
              </div>
              <div className="field">
                <label>Fino a che distanza puoi muoverti?</label>
                <div className="chip-row">
                  {RAGGIO_OPTIONS.map((o) => (
                    <button key={o.value} type="button" className={`chip ${values.raggio_km === o.value ? 'selected' : ''}`} onClick={() => set('raggio_km', o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Dove cerchiamo?</label>
                <div className="chip-row">
                  {CANALE_OPTIONS.map((o) => (
                    <button key={o.value} type="button" className={`chip ${values.canale_preferito === o.value ? 'selected' : ''}`} onClick={() => set('canale_preferito', o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Budget massimo indicativo (facoltativo)</label>
                  <input type="number" min="0" value={values.budget_max} onChange={(e) => set('budget_max', e.target.value)} />
                </div>
                <div className="field">
                  <label>Fascia oraria preferita (facoltativo)</label>
                  <input type="text" placeholder="es. mattina" value={values.fascia_oraria_preferita} onChange={(e) => set('fascia_oraria_preferita', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="field">
                <label>Questa richiesta è per te o per un'altra persona?</label>
                <div className="chip-row">
                  <button type="button" className={`chip ${!values.perAltri ? 'selected' : ''}`} onClick={() => set('perAltri', false)}>Per me</button>
                  <button type="button" className={`chip ${values.perAltri ? 'selected' : ''}`} onClick={() => set('perAltri', true)}>Per un'altra persona</button>
                </div>
              </div>
              {values.perAltri && (
                <>
                  <div className="field">
                    <label>Nome e cognome della persona</label>
                    <input type="text" value={values.per_conto_di} onChange={(e) => set('per_conto_di', e.target.value)} />
                  </div>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={values.autorizzazione_terzi} onChange={(e) => set('autorizzazione_terzi', e.target.checked)} />
                    <span>Dichiaro di essere autorizzato/a ad agire per conto di questa persona e di aver ottenuto il suo consenso.</span>
                  </label>
                </>
              )}
              <div className="field">
                <label>Nome e cognome {values.perAltri ? '(di chi compila)' : ''}</label>
                <input type="text" value={values.nome_richiedente} onChange={(e) => set('nome_richiedente', e.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="field">
                <label>Numero di telefono</label>
                <input type="tel" placeholder="Per avvisarti quando troviamo qualcosa" value={values.telefono} onChange={(e) => set('telefono', e.target.value)} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="card" style={{ padding: 18, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--ink)' }}>Riepilogo</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
                  {values.tipo_prestazione || '—'} · zona {values.zona || '—'}<br />
                  {values.nome_richiedente || '—'} · {values.telefono || '—'}
                </div>
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={values.consenso_dati} onChange={(e) => set('consenso_dati', e.target.checked)} />
                <span>Acconsento al trattamento dei dati inseriti in questo modulo esclusivamente per la ricerca dell'appuntamento da parte di Corsia. I dati non saranno ceduti a terzi, salvo alla struttura sanitaria scelta al momento della prenotazione confermata.</span>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={values.consenso_ricontatto} onChange={(e) => set('consenso_ricontatto', e.target.checked)} />
                <span>Acconsento a essere ricontattato/a via telefono o email da un operatore Corsia per comunicarmi l'esito della ricerca.</span>
              </label>
            </>
          )}
        </div>

        <div className="step-footer">
          {error && <p className="error-text">{error}</p>}
          {step < TOTAL_STEPS - 1 ? (
            <button className="btn btn-primary" onClick={handleNext}>Avanti</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Invio in corso…' : 'Cerca la prima disponibilità'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
