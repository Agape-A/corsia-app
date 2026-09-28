import { useState, useEffect, useCallback, useMemo, Fragment, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Struttura,
  StrutturaPrestazione,
  Prestazione,
  TipoStruttura,
  TIPO_STRUTTURA_LABELS,
  TIPO_STRUTTURA_ORDER,
} from '../lib/types'

export default function Strutture() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [strutture, setStrutture] = useState<Struttura[]>([])
  const [collegamenti, setCollegamenti] = useState<StrutturaPrestazione[]>([])
  const [prestazioni, setPrestazioni] = useState<Prestazione[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [strRes, colRes, presRes] = await Promise.all([
      supabase.from('strutture').select('*').order('nome', { ascending: true }),
      supabase.from('strutture_prestazioni').select('*'),
      supabase.from('prestazioni').select('*').order('categoria', { ascending: true }).order('nome', { ascending: true }),
    ])
    if (strRes.data) setStrutture(strRes.data as Struttura[])
    if (colRes.data) setCollegamenti(colRes.data as StrutturaPrestazione[])
    if (presRes.data) setPrestazioni(presRes.data as Prestazione[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!checking) loadAll()
  }, [checking, loadAll])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/staff/login', { replace: true })
  }

  async function addStruttura(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    setSaving(true)
    const { data, error } = await supabase
      .from('strutture')
      .insert({
        nome: String(fd.get('nome') || ''),
        tipo: fd.get('tipo') as TipoStruttura,
        indirizzo: String(fd.get('indirizzo') || '') || null,
        comune: String(fd.get('comune') || '') || null,
        cap: String(fd.get('cap') || '') || null,
        provincia: String(fd.get('provincia') || '') || null,
        telefono: String(fd.get('telefono') || '') || null,
        note: String(fd.get('note') || '') || null,
        fonte: 'manuale',
      })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setStrutture((prev) => [...prev, data as Struttura].sort((a, b) => a.nome.localeCompare(b.nome)))
      form.reset()
      setShowForm(false)
    }
  }

  async function deleteStruttura(id: string) {
    if (!window.confirm('Eliminare questa struttura e tutte le prestazioni collegate?')) return
    await supabase.from('strutture').delete().eq('id', id)
    setStrutture((prev) => prev.filter((s) => s.id !== id))
    setCollegamenti((prev) => prev.filter((c) => c.struttura_id !== id))
  }

  async function togglePrestazione(strutturaId: string, codice: string, existing: StrutturaPrestazione | undefined) {
    if (existing) {
      await supabase.from('strutture_prestazioni').delete().eq('id', existing.id)
      setCollegamenti((prev) => prev.filter((c) => c.id !== existing.id))
    } else {
      const { data, error } = await supabase
        .from('strutture_prestazioni')
        .insert({ struttura_id: strutturaId, prestazione_codice: codice })
        .select()
        .single()
      if (!error && data) setCollegamenti((prev) => [...prev, data as StrutturaPrestazione])
    }
  }

  async function toggleDisponibilita(row: StrutturaPrestazione) {
    const nuovoValore = !row.disponibilita_online
    setCollegamenti((prev) => prev.map((c) => (c.id === row.id ? { ...c, disponibilita_online: nuovoValore } : c)))
    await supabase.from('strutture_prestazioni').update({ disponibilita_online: nuovoValore }).eq('id', row.id)
  }

  const prestazioniPerCategoria = useMemo(() => {
    const gruppi: Record<string, Prestazione[]> = {}
    for (const p of prestazioni) {
      const cat = p.categoria || 'Altro'
      if (!gruppi[cat]) gruppi[cat] = []
      gruppi[cat].push(p)
    }
    return gruppi
  }, [prestazioni])

  const collegamentiPerStruttura = useMemo(() => {
    const mappa: Record<string, Record<string, StrutturaPrestazione>> = {}
    for (const c of collegamenti) {
      if (!mappa[c.struttura_id]) mappa[c.struttura_id] = {}
      mappa[c.struttura_id][c.prestazione_codice] = c
    }
    return mappa
  }, [collegamenti])

  if (checking) {
    return (
      <div className="wrap-wide" style={{ paddingTop: 80 }}>
        <p className="mono" style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>Verifica sessione…</p>
      </div>
    )
  }

  return (
    <div className="wrap-wide" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Strutture sanitarie</span>
          <h1 style={{ fontSize: 26, marginTop: 10 }}>Database strutture</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/staff/pipeline')}>Pipeline</button>
          {userEmail && <span className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{userEmail}</span>}
          <button className="btn btn-secondary" onClick={handleLogout}>Esci</button>
        </div>
      </div>

      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 20, maxWidth: 720 }}>
        Ogni struttura può offrire più prestazioni. Segna anche quali hanno la disponibilità verificabile online: sono quelle che la Pipeline può confermare senza bisogno di chiamare.
      </p>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        {!showForm ? (
          <button className="btn btn-primary" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setShowForm(true)}>
            + Aggiungi struttura
          </button>
        ) : (
          <form onSubmit={addStruttura}>
            <div className="field-row">
              <div className="field" style={{ flex: 2, minWidth: 220 }}>
                <label>Nome struttura</label>
                <input name="nome" required />
              </div>
              <div className="field" style={{ minWidth: 180 }}>
                <label>Tipo</label>
                <select name="tipo" defaultValue="privato">
                  {TIPO_STRUTTURA_ORDER.map((t) => (
                    <option key={t} value={t}>{TIPO_STRUTTURA_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field" style={{ flex: 2, minWidth: 220 }}>
                <label>Indirizzo</label>
                <input name="indirizzo" />
              </div>
              <div className="field">
                <label>Comune</label>
                <input name="comune" />
              </div>
              <div className="field" style={{ minWidth: 100 }}>
                <label>CAP</label>
                <input name="cap" />
              </div>
              <div className="field" style={{ minWidth: 100 }}>
                <label>Provincia</label>
                <input name="provincia" maxLength={2} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Telefono</label>
                <input name="telefono" />
              </div>
              <div className="field" style={{ flex: 2 }}>
                <label>Note (facoltativo)</label>
                <input name="note" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 20px' }} disabled={saving}>
                {saving ? 'Salvataggio…' : 'Salva struttura'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowForm(false)}>
                Annulla
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p className="mono" style={{ padding: 24, color: 'var(--ink-faint)' }}>Caricamento…</p>
        ) : strutture.length === 0 ? (
          <p className="mono" style={{ padding: 24, color: 'var(--ink-faint)' }}>Nessuna struttura ancora. Aggiungine una qui sopra.</p>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Comune</th>
                <th>Telefono</th>
                <th>Prestazioni</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {strutture.map((s) => {
                const collegate = collegamentiPerStruttura[s.id] || {}
                const numCollegate = Object.keys(collegate).length
                return (
                  <Fragment key={s.id}>
                    <tr>
                      <td style={{ fontWeight: 600 }}>{s.nome}</td>
                      <td><span className="pill">{TIPO_STRUTTURA_LABELS[s.tipo]}</span></td>
                      <td>{s.comune || '—'}{s.cap ? ` (${s.cap})` : ''}</td>
                      <td className="mono" style={{ fontSize: 12.5 }}>{s.telefono || '—'}</td>
                      <td>{numCollegate}</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: 12.5 }}
                          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        >
                          {expandedId === s.id ? 'Chiudi' : 'Prestazioni'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--error)' }}
                          onClick={() => deleteStruttura(s.id)}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                    {expandedId === s.id && (
                      <tr>
                        <td colSpan={6} style={{ background: 'var(--navy-tint)', padding: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                            Prestazioni offerte da {s.nome}
                          </div>
                          {Object.entries(prestazioniPerCategoria).map(([categoria, lista]) => (
                            <div key={categoria} style={{ marginBottom: 14 }}>
                              <div className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-faint)', marginBottom: 6 }}>
                                {categoria}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {lista.map((p) => {
                                  const link = collegate[p.codice]
                                  return (
                                    <button
                                      key={p.codice}
                                      type="button"
                                      className={`chip ${link ? 'selected' : ''}`}
                                      onClick={() => togglePrestazione(s.id, p.codice, link)}
                                    >
                                      {p.nome}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                          {numCollegate > 0 && (
                            <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                              <div className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-faint)', marginBottom: 8 }}>
                                Disponibilità verificabile online (niente telefonata)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {Object.values(collegate).map((row) => {
                                  const pres = prestazioni.find((p) => p.codice === row.prestazione_codice)
                                  return (
                                    <label key={row.id} className="checkbox-row" style={{ marginBottom: 0 }}>
                                      <input type="checkbox" checked={row.disponibilita_online} onChange={() => toggleDisponibilita(row)} />
                                      <span>{pres ? pres.nome : row.prestazione_codice}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
