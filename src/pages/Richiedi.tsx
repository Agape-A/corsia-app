import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CanalePreferito, ClasseRAO } from '../lib/types'

export default function Richiedi() {
  const [perAltri, setPerAltri] = useState(false)
  const [haImpegnativa, setHaImpegnativa] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const get = (k: string) => (form.get(k) as string) || null

    const consensoDati = form.get('consenso_dati') === 'on'
    const consensoRicontatto = form.get('consenso_ricontatto') === 'on'
    const autorizzazioneTerzi = form.get('autorizzazione_terzi') === 'on'

    if (!consensoDati || !consensoRicontatto) {
      setError('Serve il consenso al trattamento dati e al ricontatto per procedere.')
      return
    }
    if (perAltri && !autorizzazioneTerzi) {
      setError("Conferma di essere autorizzato/a ad agire per conto dell'altra persona.")
      return
    }

    setSubmitting(true)
    const { error: dbError } = await supabase.from('richieste').insert({
      nome_richiedente: get('nome_richiedente'),
      email: get('email'),
      telefono: get('telefono'),
      per_conto_di: perAltri ? get('per_conto_di') : null,
      autorizzazione_terzi: perAltri ? autorizzazioneTerzi : false,
      tipo_prestazione: get('tipo_prestazione'),
      ha_impegnativa: haImpegnativa,
      classe_rao: haImpegnativa ? (get('classe_rao') as ClasseRAO) : null,
      data_emissione_ricetta: haImpegnativa ? get('data_emissione_ricetta') : null,
      note_libere: !haImpegnativa ? get('note_libere') : null,
      zona: get('zona'),
      raggio_km: get('raggio_km') ? Number(get('raggio_km')) : null,
      canale_preferito: (get('canale_preferito') as CanalePreferito) ?? 'entrambi',
      budget_max: get('budget_max') ? Number(get('budget_max')) : null,
      fascia_oraria_preferita: get('fascia_oraria_preferita'),
      consenso_dati: consensoDati,
      consenso_ricontatto: consensoRicontatto,
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
      <div className="wrap" style={{ paddingBlock: 60 }}>
        <div className="card success-box">
          <span className="eyebrow">Richiesta inviata</span>
          <h1 style={{ fontSize: 28, marginTop: 16 }}>Ci siamo. La stiamo prendendo in carico.</h1>
          <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>
            Ti ricontattiamo appena troviamo il primo appuntamento utile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap" style={{ paddingBlock: 48 }}>
      <div className="wordmark" style={{ fontFamily: 'Fraunces', fontWeight: 600, fontSize: 22, marginBottom: 28 }}>
        Corsia<span style={{ color: 'var(--accent)' }}>·</span>
      </div>
      <span className="eyebrow">Richiesta di ricerca</span>
      <h1 style={{ fontSize: 30, marginTop: 14, marginBottom: 28 }}>Raccontaci cosa ti serve</h1>

      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="nome_richiedente">Nome e cognome</label>
          <input id="nome_richiedente" name="nome_richiedente" type="text" required />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="telefono">Telefono</label>
            <input id="telefono" name="telefono" type="tel" required />
          </div>
        </div>

        <div className="field">
          <label>Questa richiesta è per te o per un'altra persona?</label>
          <div className="field-row">
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="radio" name="per_chi" checked={!perAltri} onChange={() => setPerAltri(false)} />
              <span>Per me</span>
            </label>
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="radio" name="per_chi" checked={perAltri} onChange={() => setPerAltri(true)} />
              <span>Per un'altra persona</span>
            </label>
          </div>
        </div>

        {perAltri && (
          <>
            <div className="field">
              <label htmlFor="per_conto_di">Nome e cognome della persona</label>
              <input id="per_conto_di" name="per_conto_di" type="text" required={perAltri} />
            </div>
            <label className="checkbox-row">
              <input type="checkbox" name="autorizzazione_terzi" />
              <span>Dichiaro di essere autorizzato/a ad agire per conto di questa persona e di aver ottenuto il suo consenso.</span>
            </label>
          </>
        )}

        <div className="field">
          <label htmlFor="tipo_prestazione">Tipo di prestazione</label>
          <input id="tipo_prestazione" name="tipo_prestazione" type="text" placeholder="es. ecografia addome, visita cardiologica" required />
        </div>

        <div className="field">
          <label>Hai già un'impegnativa (ricetta) del SSN?</label>
          <div className="field-row">
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="radio" name="ha_impegnativa" checked={haImpegnativa} onChange={() => setHaImpegnativa(true)} />
              <span>Sì</span>
            </label>
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="radio" name="ha_impegnativa" checked={!haImpegnativa} onChange={() => setHaImpegnativa(false)} />
              <span>No</span>
            </label>
          </div>
        </div>

        {haImpegnativa ? (
          <div className="field-row">
            <div className="field">
              <label htmlFor="classe_rao">Classe di priorità RAO</label>
              <select id="classe_rao" name="classe_rao" required={haImpegnativa}>
                <option value="">Seleziona...</option>
                <option value="U">U — Urgente</option>
                <option value="B">B — Breve</option>
                <option value="D">D — Differibile</option>
                <option value="P">P — Programmata</option>
              </select>
              <span className="hint">La trovi stampata sulla ricetta</span>
            </div>
            <div className="field">
              <label htmlFor="data_emissione_ricetta">Data di emissione</label>
              <input id="data_emissione_ricetta" name="data_emissione_ricetta" type="date" required={haImpegnativa} />
            </div>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="note_libere">Note (facoltativo)</label>
            <textarea id="note_libere" name="note_libere" rows={3} placeholder="Cosa ti serve, in breve" />
          </div>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="zona">Zona (CAP o città)</label>
            <input id="zona" name="zona" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="raggio_km">Fino a che distanza puoi muoverti?</label>
            <select id="raggio_km" name="raggio_km" defaultValue="20">
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
              <option value="999">Tutta la regione</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="canale_preferito">Dove cerchiamo?</label>
          <select id="canale_preferito" name="canale_preferito" defaultValue="entrambi">
            <option value="pubblico">Solo pubblico (CUP)</option>
            <option value="privato">Solo privato convenzionato</option>
            <option value="entrambi">Entrambi, mostrami il primo disponibile</option>
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="budget_max">Budget massimo indicativo (facoltativo)</label>
            <input id="budget_max" name="budget_max" type="number" min="0" />
          </div>
          <div className="field">
            <label htmlFor="fascia_oraria_preferita">Fascia oraria preferita per il ricontatto (facoltativo)</label>
            <input id="fascia_oraria_preferita" name="fascia_oraria_preferita" type="text" placeholder="es. mattina" />
          </div>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" name="consenso_dati" />
          <span>Acconsento al trattamento dei dati inseriti in questo modulo esclusivamente per la ricerca dell'appuntamento da parte di Corsia. I dati non saranno ceduti a terzi, salvo alla struttura sanitaria scelta al momento della prenotazione confermata.</span>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" name="consenso_ricontatto" />
          <span>Acconsento a essere ricontattato/a via telefono o email da un operatore Corsia per comunicarmi l'esito della ricerca.</span>
        </label>

        {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Invio in corso...' : 'Invia la richiesta'}
        </button>
      </form>
    </div>
  )
}
