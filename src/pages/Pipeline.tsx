import { useState, useEffect, useCallback, Fragment, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Richiesta,
  Chiamata,
  Struttura,
  StrutturaCandidata,
  RichiestaStato,
  CanaleChiamata,
  RAO_LABELS,
  STATO_LABELS,
  STATO_ORDER,
  TIPO_STRUTTURA_LABELS,
} from '../lib/types'

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Pipeline() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [richieste, setRichieste] = useState<Richiesta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<RichiestaStato | 'tutte'>('tutte')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [chiamateByRichiesta, setChiamateByRichiesta] = useState<Record<string, Chiamata[]>>({})
  const [candidatiByRichiesta, setCandidatiByRichiesta] = useState<Record<string, StrutturaCandidata[]>>({})
  const [loadingCandidati, setLoadingCandidati] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/staff/login', { replace: true })
      } else {
        setUserEmail(data.session.user.email ?? null)
        setChecking(false)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/staff/login', { replace: true })
    })
    return () => sub.subscription.unsubscribe()
  }, [navigate])

  const loadRichieste = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('richieste')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setRichieste(data as Richiesta[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!checking) loadRichieste()
  }, [checking, loadRichieste])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/staff/login', { replace: true })
  }

  async function updateStato(id: string, stato: RichiestaStato) {
    setRichieste((prev) => prev.map((r) => (r.id === id ? { ...r, stato } : r)))
    await supabase.from('richieste').update({ stato }).eq('id', id)
  }

  async function updateDettagli(id: string, patch: Partial<Richiesta>) {
    setRichieste((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    await supabase.from('richieste').update(patch).eq('id', id)
  }

  async function loadCandidati(r: Richiesta) {
    setLoadingCandidati((prev) => ({ ...prev, [r.id]: true }))
    let righe: StrutturaCandidata[] = []
    if (r.prestazione_codice) {
      const { data } = await supabase
        .from('strutture_prestazioni')
        .select('disponibilita_online, note, struttura:strutture(*)')
        .eq('prestazione_codice', r.prestazione_codice)
      if (data) {
        righe = (data as unknown as { disponibilita_online: boolean; note: string | null; struttura: Struttura | null }[])
          .filter((row) => row.struttura)
          .map((row) => ({ struttura: row.struttura as Struttura, disponibilita_online: row.disponibilita_online, note: row.note }))
      }
    } else {
      const { data } = await supabase.from('strutture').select('*')
      if (data) righe = (data as Struttura[]).map((s) => ({ struttura: s, disponibilita_online: false, note: null }))
    }
    const zona = (r.zona || '').trim().toLowerCase()
    const filtrate = zona
      ? righe.filter((c) => {
          const comune = (c.struttura.comune || '').toLowerCase()
          const cap = (c.struttura.cap || '').toLowerCase()
          return (comune !== '' && (comune.includes(zona) || zona.includes(comune))) || cap === zona
        })
      : righe
    filtrate.sort((a, b) => Number(b.disponibilita_online) - Number(a.disponibilita_online))
    setCandidatiByRichiesta((prev) => ({ ...prev, [r.id]: filtrate }))
    setLoadingCandidati((prev) => ({ ...prev, [r.id]: false }))
  }

  async function toggleExpand(r: Richiesta) {
    if (expandedId === r.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(r.id)
    if (!chiamateByRichiesta[r.id]) {
      const { data } = await supabase
        .from('chiamate')
        .select('*')
        .eq('richiesta_id', r.id)
        .order('created_at', { ascending: false })
      setChiamateByRichiesta((prev) => ({ ...prev, [r.id]: (data as Chiamata[]) ?? [] }))
    }
    if (!candidatiByRichiesta[r.id]) {
      loadCandidati(r)
    }
  }

  async function handleLogCall(richiestaId: string, form: HTMLFormElement) {
    const fd = new FormData(form)
    const canale = fd.get('canale') as CanaleChiamata
    const struttura = String(fd.get('struttura_contattata') || '')
    const esito = String(fd.get('esito') || '')
    const esitoPositivo = fd.get('esito_positivo') === 'on'
    const { data, error } = await supabase
      .from('chiamate')
      .insert({
        richiesta_id: richiestaId,
        canale,
        struttura_contattata: struttura || null,
        esito: esito || null,
        esito_positivo: esitoPositivo,
      })
      .select()
      .single()
    if (!error && data) {
      setChiamateByRichiesta((prev) => ({
        ...prev,
        [richiestaId]: [data as Chiamata, ...(prev[richiestaId] ?? [])],
      }))
      form.reset()
    }
  }

  if (checking) {
    return (
      <div className="wrap-wide" style={{ paddingTop: 80 }}>
        <p className="mono" style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>Verifica sessione…</p>
      </div>
    )
  }

  const visibili = filtro === 'tutte' ? richieste : richieste.filter((r) => r.stato === filtro)

  return (
    <div className="wrap-wide" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Pipeline richieste</span>
          <h1 style={{ fontSize: 26, marginTop: 10 }}>Operazioni Corsia</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/staff/strutture')}>Strutture</button>
          {userEmail && <span className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{userEmail}</span>}
          <button className="btn btn-secondary" onClick={handleLogout}>Esci</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="mono" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-faint)' }}>
          Filtra per stato
        </label>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as RichiestaStato | 'tutte')} style={{ font: 'inherit', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line-strong)' }}>
          <option value="tutte">Tutte ({richieste.length})</option>
          {STATO_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATO_LABELS[s]} ({richieste.filter((r) => r.stato === s).length})
            </option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={loadRichieste} style={{ marginLeft: 'auto' }}>
          Aggiorna
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p className="mono" style={{ padding: 24, color: 'var(--ink-faint)' }}>Caricamento…</p>
        ) : visibili.length === 0 ? (
          <p className="mono" style={{ padding: 24, color: 'var(--ink-faint)' }}>Nessuna richiesta.</p>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th>Ricevuta</th>
                <th>Richiedente</th>
                <th>Prestazione</th>
                <th>RAO / scadenza</th>
                <th>Zona</th>
                <th>Canale</th>
                <th>Stato</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibili.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{fmtDateTime(r.created_at)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.nome_richiedente}</div>
                      <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{r.email} · {r.telefono}</div>
                      {r.per_conto_di && (
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>per conto di: {r.per_conto_di}</div>
                      )}
                    </td>
                    <td>{r.tipo_prestazione}</td>
                    <td>
                      {r.classe_rao ? (
                        <>
                          <span className="pill">{RAO_LABELS[r.classe_rao]}</span>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 }}>
                            scad. {fmtDate(r.scadenza_rao)}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>senza impegnativa</span>
                      )}
                    </td>
                    <td>
                      {r.zona || '—'}
                      {r.raggio_km ? <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>raggio {r.raggio_km} km</div> : null}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{r.canale_preferito}</td>
                    <td>
                      <select
                        value={r.stato}
                        onChange={(e) => updateStato(r.id, e.target.value as RichiestaStato)}
                      >
                        {STATO_ORDER.map((s) => (
                          <option key={s} value={s}>{STATO_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 12.5 }} onClick={() => toggleExpand(r)}>
                        {expandedId === r.id ? 'Chiudi' : 'Dettagli'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--navy-tint)', padding: 20 }}>
                        <div style={{ marginBottom: 22 }}>
                          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Strutture candidate</h3>
                          {loadingCandidati[r.id] ? (
                            <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Ricerca nel database…</p>
                          ) : !r.zona ? (
                            <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Nessuna zona indicata dal paziente.</p>
                          ) : (candidatiByRichiesta[r.id] ?? []).length === 0 ? (
                            <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Nessuna struttura nel database per questa zona/prestazione — serve ancora la ricerca manuale.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(candidatiByRichiesta[r.id] ?? []).map((c) => (
                                <div
                                  key={c.struttura.id}
                                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px', flexWrap: 'wrap', gap: 8 }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                                      {c.struttura.nome} <span className="pill" style={{ marginLeft: 6 }}>{TIPO_STRUTTURA_LABELS[c.struttura.tipo]}</span>
                                    </div>
                                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                                      {c.struttura.comune || '—'}{c.struttura.telefono ? ` · ${c.struttura.telefono}` : ''}
                                    </div>
                                  </div>
                                  {c.disponibilita_online && (
                                    <span className="pill" style={{ background: 'var(--success-tint)', color: 'var(--success-text)' }}>
                                      disponibile online
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {!r.prestazione_codice && (candidatiByRichiesta[r.id] ?? []).length > 0 && (
                            <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
                              Prestazione non ancora tradotta nel codice standard: qui sopra ci sono tutte le strutture della zona, non filtrate per prestazione.
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                          <div>
                            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Esito ricerca</h3>
                            <div className="field-row">
                              <div className="field">
                                <label>Struttura trovata</label>
                                <input
                                  defaultValue={r.struttura_trovata ?? ''}
                                  onBlur={(e) => updateDettagli(r.id, { struttura_trovata: e.target.value || null })}
                                />
                              </div>
                              <div className="field">
                                <label>Operatore assegnato</label>
                                <input
                                  defaultValue={r.operatore_assegnato ?? ''}
                                  onBlur={(e) => updateDettagli(r.id, { operatore_assegnato: e.target.value || null })}
                                />
                              </div>
                            </div>
                            <div className="field-row">
                              <div className="field">
                                <label>Data/ora appuntamento</label>
                                <input
                                  type="datetime-local"
                                  defaultValue={r.appuntamento_data ? r.appuntamento_data.slice(0, 16) : ''}
                                  onBlur={(e) => updateDettagli(r.id, { appuntamento_data: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                />
                              </div>
                              <div className="field">
                                <label>Prezzo (se privato)</label>
                                <input
                                  type="number"
                                  defaultValue={r.prezzo ?? ''}
                                  onBlur={(e) => updateDettagli(r.id, { prezzo: e.target.value ? Number(e.target.value) : null })}
                                />
                              </div>
                            </div>
                            {r.note_libere && (
                              <div style={{ fontSize: 13, marginTop: 8 }}>
                                <strong>Note:</strong> {r.note_libere}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Log chiamate</h3>
                            <form
                              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                                e.preventDefault()
                                handleLogCall(r.id, e.currentTarget)
                              }}
                              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, marginBottom: 14 }}
                            >
                              <div className="field-row">
                                <div className="field" style={{ minWidth: 120, flex: '0 0 120px' }}>
                                  <label>Canale</label>
                                  <select name="canale" defaultValue="umano">
                                    <option value="umano">Umano</option>
                                    <option value="ai">AI</option>
                                  </select>
                                </div>
                                <div className="field">
                                  <label>Struttura contattata</label>
                                  <input name="struttura_contattata" />
                                </div>
                              </div>
                              <div className="field">
                                <label>Esito</label>
                                <textarea name="esito" rows={2} />
                              </div>
                              <label className="checkbox-row">
                                <input type="checkbox" name="esito_positivo" />
                                Esito positivo (disponibilità trovata)
                              </label>
                              <button type="submit" className="btn btn-primary" style={{ fontSize: 12.5, padding: '9px 16px' }}>
                                Registra chiamata
                              </button>
                            </form>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                              {(chiamateByRichiesta[r.id] ?? []).length === 0 && (
                                <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Nessuna chiamata registrata.</p>
                              )}
                              {(chiamateByRichiesta[r.id] ?? []).map((c) => (
                                <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 12.5 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                    <span className="pill">{c.canale === 'ai' ? 'AI' : 'Umano'}</span>
                                    <span className="mono" style={{ color: 'var(--ink-faint)' }}>{fmtDateTime(c.created_at)}</span>
                                  </div>
                                  {c.struttura_contattata && <div style={{ marginTop: 4 }}>{c.struttura_contattata}</div>}
                                  {c.esito && <div style={{ marginTop: 2, color: 'var(--ink-soft)' }}>{c.esito}</div>}
                                  {c.esito_positivo && <div style={{ marginTop: 2, color: 'var(--accent-ink)', fontWeight: 600 }}>✓ disponibilità trovata</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
